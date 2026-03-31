const CARRIERS = {
  cj: { label: "CJ대한통운", build: (no) => `https://www.cjlogistics.com/ko/tool/parcel/tracking?gnbInvcNo=${encodeURIComponent(no)}` },
  hanjin: {
    label: "한진택배",
    build: (no) =>
      `https://www.hanjin.com/kor/CMS/DeliveryMgr/WaybillResult.do?mCode=MN038&schLang=KR&wblnumText2=${encodeURIComponent(no)}`,
  },
  lotte: { label: "롯데택배", build: (no) => `https://www.lotteglogis.com/home/reservation/tracking/invoiceView?InvNo=${encodeURIComponent(no)}` },
  logen: { label: "로젠택배", build: (no) => `https://www.ilogen.com/web/personal/trace/${encodeURIComponent(no)}` },
  epost: {
    label: "우체국택배",
    build: (no) =>
      `https://service.epost.go.kr/trace.RetrieveDomRigiTraceList.comm?sid1=${encodeURIComponent(no)}&displayHeader=N`,
  },
  cupost: { label: "CU편의점택배", build: (no) => `https://www.cupost.co.kr/postbox/delivery/localResult.cupost?invoice_no=${encodeURIComponent(no)}` },
  gs: { label: "GS택배", build: (no) => `https://www.cvsnet.co.kr/reservation-inquiry/delivery/index.do?dlvry_type=domestic&invoice_no=${encodeURIComponent(no)}` },
};

export const TRACKING_CARRIER_CODES = Object.keys(CARRIERS);

export function getCarrierLabel(code) {
  if (!code) return "";
  return CARRIERS[code]?.label || code;
}

export function buildTrackingUrl(carrierCode, trackingNumber) {
  const no = String(trackingNumber || "").trim();
  if (!no) return null;
  const entry = CARRIERS[carrierCode];
  if (!entry) return null;
  try {
    return entry.build(no);
  } catch {
    return null;
  }
}

export function isValidCarrierCode(code) {
  return Boolean(code && CARRIERS[code]);
}

export function listCarriers() {
  return TRACKING_CARRIER_CODES.map((code) => ({ code, label: CARRIERS[code].label }));
}
