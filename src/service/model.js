import axios from '../utils/axios'

/** 我的模型库 */
export const getModelLibrary = () => axios.get('/model/library')

/** 从模型库删除 */
export const deleteFromLibrary = (modelId) => axios.delete(`/model/library/${modelId}`)
