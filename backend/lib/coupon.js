export async function validateCoupon(db, code, subtotal) {
  if (!code || typeof code !== "string") {
    return { valid: false, message: "쿠폰 코드를 입력해주세요." };
  }

  const normalizedCode = code.trim().toUpperCase();
  if (!normalizedCode) {
    return { valid: false, message: "쿠폰 코드를 입력해주세요." };
  }

  const amount = Number(subtotal);
  if (isNaN(amount) || amount < 0) {
    return { valid: false, message: "유효한 주문 금액이 아닙니다." };
  }

  try {
    const [rows] = await db.query(
      "SELECT * FROM coupons WHERE UPPER(TRIM(code)) = ? LIMIT 1",
      [normalizedCode]
    );
    const coupon = rows?.[0];
    if (!coupon) {
      return { valid: false, message: "존재하지 않거나 만료된 쿠폰입니다." };
    }

    const now = new Date();
    if (coupon.valid_from && new Date(coupon.valid_from) > now) {
      return { valid: false, message: "아직 사용 기간이 아닙니다." };
    }
    if (coupon.valid_until && new Date(coupon.valid_until) < now) {
      return { valid: false, message: "사용 기간이 만료된 쿠폰입니다." };
    }
    if (coupon.usage_limit != null && coupon.used_count >= coupon.usage_limit) {
      return { valid: false, message: "사용 횟수가 소진된 쿠폰입니다." };
    }

    const minOrder = coupon.min_order_amount != null ? Number(coupon.min_order_amount) : 0;
    if (amount < minOrder) {
      return {
        valid: false,
        message: `최소 주문 금액 ${minOrder.toLocaleString()}원 이상일 때 사용 가능합니다.`,
      };
    }

    let discount = 0;
    if (coupon.type === "fixed") {
      discount = Math.min(Number(coupon.value) || 0, amount);
    } else {
      const percent = Number(coupon.value) || 0;
      discount = Math.floor((amount * percent) / 100);
      const maxDiscount =
        coupon.max_discount != null ? Number(coupon.max_discount) : null;
      if (maxDiscount != null && discount > maxDiscount) {
        discount = maxDiscount;
      }
    }

    if (discount <= 0) {
      return { valid: false, message: "적용 가능한 할인이 없습니다." };
    }

    const finalTotal = Math.max(0, amount - discount);
    return {
      valid: true,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        name: coupon.name,
        type: coupon.type,
        value: coupon.value,
      },
      discount,
      finalTotal,
    };
  } catch (err) {
    console.error("쿠폰 검증 오류:", err);
    return { valid: false, message: "쿠폰 확인 중 오류가 발생했습니다." };
  }
}
