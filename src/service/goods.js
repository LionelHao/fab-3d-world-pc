import axios from '../utils/axios'

/** 在售商品列表,categoryId 可选 */
export const getGoodsList = (categoryId) =>
  axios.get('/trade/goods', { params: categoryId ? { categoryId } : {} })

/** 商品详情 */
export const getGoodsDetail = (id) => axios.get(`/trade/goods/${id}`)

/** 商品分类 */
export const getCategories = () => axios.get('/trade/categories')

/** 关键词搜索商品 */
export const searchGoods = (keyword) =>
  axios.get('/trade/goods/search', { params: { keyword } })
