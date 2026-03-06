import axios from "axios";

/**
 * 카페24 API 클라이언트
 * 카페24 Open API를 사용하여 상품 정보를 가져옵니다.
 */
class Cafe24Client {
  constructor() {
    this.mallId = process.env.CAFE24_MALL_ID;
    this.clientId = process.env.CAFE24_CLIENT_ID;
    this.clientSecret = process.env.CAFE24_CLIENT_SECRET;
    this.apiUrl = process.env.CAFE24_API_URL || `https://${this.mallId}.cafe24api.com`;
    this.accessToken = process.env.CAFE24_ACCESS_TOKEN;
  }

  /**
   * API 요청 헤더 생성
   */
  getHeaders() {
    if (!this.accessToken) {
      throw new Error("카페24 Access Token이 설정되지 않았습니다.");
    }

    return {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${this.accessToken}`,
      "X-Cafe24-Api-Version": "2024-03-01", // 최신 API 버전
    };
  }

  /**
   * 상품 목록 조회
   * @param {Object} options - 조회 옵션 (limit, offset, category 등)
   * @returns {Promise<Array>} 상품 목록
   */
  async getProducts(options = {}) {
    try {
      const params = new URLSearchParams({
        limit: options.limit || 100,
        offset: options.offset || 0,
        ...options,
      });

      const response = await axios.get(
        `${this.apiUrl}/admin/products.json?${params.toString()}`,
        { headers: this.getHeaders() }
      );

      return response.data.products || [];
    } catch (error) {
      console.error("❌ 카페24 상품 조회 실패:", error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * 상품 상세 조회
   * @param {string|number} productId - 상품 ID
   * @returns {Promise<Object>} 상품 정보
   */
  async getProduct(productId) {
    try {
      const response = await axios.get(
        `${this.apiUrl}/admin/products/${productId}.json`,
        { headers: this.getHeaders() }
      );

      return response.data.product || null;
    } catch (error) {
      console.error(`❌ 카페24 상품 ${productId} 조회 실패:`, error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * 카테고리별 상품 조회
   * @param {string|number} categoryId - 카테고리 ID
   * @param {Object} options - 조회 옵션
   * @returns {Promise<Array>} 상품 목록
   */
  async getProductsByCategory(categoryId, options = {}) {
    try {
      const params = new URLSearchParams({
        category: categoryId,
        limit: options.limit || 100,
        offset: options.offset || 0,
        ...options,
      });

      const response = await axios.get(
        `${this.apiUrl}/admin/products.json?${params.toString()}`,
        { headers: this.getHeaders() }
      );

      return response.data.products || [];
    } catch (error) {
      console.error("❌ 카페24 카테고리별 상품 조회 실패:", error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * 카페24 상품 데이터를 내부 형식으로 변환
   * @param {Object} cafe24Product - 카페24 상품 데이터
   * @returns {Object} 변환된 상품 데이터
   */
  transformProduct(cafe24Product) {
    return {
      id: cafe24Product.product_no || cafe24Product.product_id,
      name: cafe24Product.product_name,
      description: cafe24Product.summary_description || cafe24Product.description,
      price: parseFloat(cafe24Product.price || cafe24Product.retail_price || 0),
      stock: cafe24Product.quantity || 0,
      category: cafe24Product.category || "기타",
      image_url: cafe24Product.images?.main?.[0] || cafe24Product.image || "",
      created_at: cafe24Product.created_date,
      updated_at: cafe24Product.updated_date,
    };
  }

  /**
   * 카페24 API 연결 테스트
   * @returns {Promise<boolean>} 연결 성공 여부
   */
  async testConnection() {
    try {
      await this.getProducts({ limit: 1 });
      return true;
    } catch (error) {
      console.error("❌ 카페24 API 연결 실패:", error.message);
      return false;
    }
  }
}

// 싱글톤 인스턴스 생성
let cafe24Client = null;

/**
 * 카페24 클라이언트 인스턴스 가져오기
 * @returns {Cafe24Client|null} 카페24 클라이언트 인스턴스
 */
export function getCafe24Client() {
  if (!cafe24Client) {
    const mallId = process.env.CAFE24_MALL_ID;
    if (!mallId) {
      console.warn("⚠️ 카페24 설정이 없습니다. 환경 변수를 확인해주세요.");
      return null;
    }
    cafe24Client = new Cafe24Client();
  }
  return cafe24Client;
}

/**
 * 카페24 사용 가능 여부 확인
 * @returns {boolean} 카페24 사용 가능 여부
 */
export function isCafe24Enabled() {
  const mallId = process.env.CAFE24_MALL_ID;
  const accessToken = process.env.CAFE24_ACCESS_TOKEN;
  // 빈 문자열도 false로 처리
  return !!(mallId && mallId.trim() && accessToken && accessToken.trim());
}

export default Cafe24Client;
