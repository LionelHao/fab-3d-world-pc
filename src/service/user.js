/**
 * service/user — PC 端 user 域接口（auth 域最小集）
 *
 * 收敛说明（v2 user-auth P1）：原 login/logout 移至 `service/auth.js`，本文件
 * 仅保留 auth 域用户资料读取（getUserInfo）。其余资料 / 头像 / stat / 导出 /
 * 注销账号归 user-info 模块。
 *
 * 同源副本对齐：fab-3d-world-web/src/service/user.js
 */
import axios from '../utils/axios'

/** 当前登录用户基本资料（auth 域最小集：userId / username / nickname / avatar / roles / status） */
export const getUserInfo = () => axios.get('/user/info')
