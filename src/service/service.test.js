import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/utils/axios', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() }
}))

import axios from '@/utils/axios'
import { getPosts, getPostDetail } from '@/service/content'
import { getGoodsList, getGoodsDetail, getCategories, searchGoods } from '@/service/goods'

describe('service/content — 社区接口契约', () => {
  beforeEach(() => vi.clearAllMocks())

  it('getPosts POST /content/posts', () => {
    getPosts(12, 1)
    expect(axios.post).toHaveBeenCalledWith('/content/posts', { number: 12, page: 1 })
  })
  it('getPostDetail GET /content/posts/{id}', () => {
    getPostDetail(3)
    expect(axios.get).toHaveBeenCalledWith('/content/posts/3')
  })
})

describe('service/goods — 市场接口契约', () => {
  beforeEach(() => vi.clearAllMocks())

  it('getGoodsList GET /trade/goods', () => {
    getGoodsList()
    expect(axios.get).toHaveBeenCalledWith('/trade/goods', { params: {} })
  })
  it('getGoodsList 带分类', () => {
    getGoodsList(2)
    expect(axios.get).toHaveBeenCalledWith('/trade/goods', { params: { categoryId: 2 } })
  })
  it('getGoodsDetail GET /trade/goods/{id}', () => {
    getGoodsDetail(5)
    expect(axios.get).toHaveBeenCalledWith('/trade/goods/5')
  })
  it('getCategories GET /trade/categories', () => {
    getCategories()
    expect(axios.get).toHaveBeenCalledWith('/trade/categories')
  })
  it('searchGoods GET /trade/goods/search', () => {
    searchGoods('龙')
    expect(axios.get).toHaveBeenCalledWith('/trade/goods/search', { params: { keyword: '龙' } })
  })
})
