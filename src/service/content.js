import axios from '../utils/axios'

/** 帖子流(分页) */
export const getPosts = (number = 12, page = 1) =>
  axios.post('/content/posts', { number, page })

/** 帖子详情 */
export const getPostDetail = (id) => axios.get(`/content/posts/${id}`)
