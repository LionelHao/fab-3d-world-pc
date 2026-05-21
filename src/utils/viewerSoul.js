/**
 * viewerSoul — 给 online-3d-viewer EmbeddedViewer 注入「3D 灵魂」
 *
 * Phase 4 / T4.1 — 满足 UI_REDESIGN_PLAN.md §2.8「3D viewer 必须有相机轨道动画 / 模型自转」。
 *
 * 提供一套相机状态机：
 *   模型加载完成 → 相机轨道入场动画 (easeOutCubic) → 空闲自转
 *   用户拖拽 → 暂停自转（交回 OV 原生导航）→ 停手 N 秒后从当前视角恢复自转
 * 另暴露 setParallax()（hover 视差，T4.4 用）与 getAzimuth()（真实方位角，T4.2 orbit readout 用）。
 *
 * 用法：
 *   import { attachViewerSoul } from '@/utils/viewerSoul'
 *   let soul = null
 *   viewer = new OV.EmbeddedViewer(container, {
 *     onModelLoaded: () => { soul ? soul.restart() : (soul = attachViewerSoul(viewer)) },
 *   })
 *   onUnmounted(() => soul?.dispose())
 *
 * 注：fab-3d-world-web 与 fab-3d-world-pc 为独立 repo，无法共享模块，各置一份同源副本。
 *     两份必须保持一致 —— 改动时同步两端。
 */

const INTRO_MS = 820 // 入场轨道动画时长
const INTRO_SWEEP = 0.92 // 入场扫过的方位角（弧度）
const IDLE_SPIN_PER_SEC = 0.22 // 空闲自转角速度（弧度/秒）
const RESUME_DELAY_MS = 2400 // 用户停手后恢复自转的延时
const PARALLAX_MAX = 0.12 // hover 视差最大偏移（弧度）
const RAD_TO_DEG = 180 / Math.PI

const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3)

/** 绕单位轴 axis 旋转向量 v 角度 angle（Rodrigues 旋转公式） */
function rotateAroundAxis(v, axis, angle) {
  const cos = Math.cos(angle)
  const sin = Math.sin(angle)
  const dot = v.x * axis.x + v.y * axis.y + v.z * axis.z
  const cx = axis.y * v.z - axis.z * v.y
  const cy = axis.z * v.x - axis.x * v.z
  const cz = axis.x * v.y - axis.y * v.x
  return {
    x: v.x * cos + cx * sin + axis.x * dot * (1 - cos),
    y: v.y * cos + cy * sin + axis.y * dot * (1 - cos),
    z: v.z * cos + cz * sin + axis.z * dot * (1 - cos),
  }
}

function normalize(v) {
  const len = Math.hypot(v.x, v.y, v.z) || 1
  return { x: v.x / len, y: v.y / len, z: v.z / len }
}

/** EmbeddedViewer 不可用时的安全空壳，调用方无需判空 */
const NOOP_SOUL = {
  pause() {},
  resume() {},
  restart() {},
  dispose() {},
  setParallax() {},
  getAzimuth: () => 0,
  getElevation: () => 0,
}

/**
 * @param {object} embeddedViewer  online-3d-viewer 的 EmbeddedViewer 实例
 * @param {object} [opts]
 * @param {number} [opts.spinPerSec]  空闲自转角速度（弧度/秒）
 * @param {number} [opts.introMs]     入场动画时长（毫秒）
 * @param {boolean} [opts.autoSpin]   是否空闲自转（默认 true）
 * @returns {{pause,resume,restart,dispose,setParallax,getAzimuth}}
 */
export function attachViewerSoul(embeddedViewer, opts = {}) {
  const viewer = embeddedViewer && embeddedViewer.GetViewer && embeddedViewer.GetViewer()
  const canvas = embeddedViewer && embeddedViewer.canvas
  if (!viewer || !canvas) return NOOP_SOUL

  const spinPerSec = opts.spinPerSec ?? IDLE_SPIN_PER_SEC
  const introMs = opts.introMs ?? INTRO_MS
  const autoSpin = opts.autoSpin !== false

  let restCamera = null // 入场结束后的静止相机，自转的旋转基准
  let azimuth = 0 // 相对 restCamera 已累加的方位角（弧度）
  let mode = 'idle' // 'intro' | 'idle' | 'interacting' | 'paused'
  let introStart = 0
  let lastFrame = 0
  let rafId = 0
  let resumeTimer = 0
  let disposed = false
  let parallax = { x: 0, y: 0 } // hover 视差偏移（弧度）

  function captureRest() {
    restCamera = viewer.GetCamera().Clone()
  }

  /** 把 restCamera 绕 up 轴旋转 az、叠加 parallax，写回 viewer */
  function applyAzimuth(az) {
    if (!restCamera) return
    const c = restCamera.center
    const up = normalize(restCamera.up)
    const eye = restCamera.eye
    let offset = { x: eye.x - c.x, y: eye.y - c.y, z: eye.z - c.z }
    offset = rotateAroundAxis(offset, up, az + parallax.x)
    if (parallax.y !== 0) {
      const side = normalize({
        x: up.y * offset.z - up.z * offset.y,
        y: up.z * offset.x - up.x * offset.z,
        z: up.x * offset.y - up.y * offset.x,
      })
      offset = rotateAroundAxis(offset, side, parallax.y)
    }
    const cam = restCamera.Clone()
    cam.eye.x = c.x + offset.x
    cam.eye.y = c.y + offset.y
    cam.eye.z = c.z + offset.z
    viewer.SetCamera(cam)
    viewer.Render()
  }

  function frame(now) {
    if (disposed) return
    if (!lastFrame) lastFrame = now
    const dt = Math.min(0.05, (now - lastFrame) / 1000)
    lastFrame = now

    if (mode === 'intro') {
      const t = Math.min(1, (now - introStart) / introMs)
      azimuth = -INTRO_SWEEP * (1 - easeOutCubic(t))
      applyAzimuth(azimuth)
      if (t >= 1) {
        azimuth = 0
        mode = 'idle'
      }
    } else if (mode === 'idle') {
      if (autoSpin) azimuth += spinPerSec * dt
      applyAzimuth(azimuth)
    } else if (mode === 'paused' && (parallax.x !== 0 || parallax.y !== 0)) {
      // hover 已停转，但仍跟随光标视差
      applyAzimuth(azimuth)
    }
    // interacting：交给 OV 原生导航，本模块不写相机

    rafId = requestAnimationFrame(frame)
  }

  /* ── 用户交互检测 ── */
  function onPointerDown() {
    if (disposed) return
    if (resumeTimer) {
      clearTimeout(resumeTimer)
      resumeTimer = 0
    }
    mode = 'interacting'
  }

  function onInteractEnd() {
    if (disposed || mode !== 'interacting') return
    if (resumeTimer) clearTimeout(resumeTimer)
    resumeTimer = setTimeout(() => {
      resumeTimer = 0
      if (disposed) return
      captureRest() // 从用户停手处接着转，不回弹
      azimuth = 0
      lastFrame = 0
      mode = 'idle'
    }, RESUME_DELAY_MS)
  }

  function onWheel() {
    if (disposed) return
    if (resumeTimer) clearTimeout(resumeTimer)
    mode = 'interacting'
    onInteractEnd()
  }

  canvas.addEventListener('pointerdown', onPointerDown)
  window.addEventListener('pointerup', onInteractEnd)
  window.addEventListener('pointercancel', onInteractEnd)
  canvas.addEventListener('wheel', onWheel, { passive: true })

  /* ── 容器尺寸变化时同步 viewer（响应式 + 兜底初始 0 宽场景）── */
  let resizeObs = null
  const resizeTarget = embeddedViewer.parentElement || canvas.parentElement
  if (resizeTarget && typeof ResizeObserver !== 'undefined') {
    resizeObs = new ResizeObserver(() => {
      try {
        embeddedViewer.Resize()
      } catch {
        // noop
      }
    })
    resizeObs.observe(resizeTarget)
  }

  /* ── 启动：捕获基准 + 入场动画 ── */
  captureRest()
  introStart = performance.now()
  lastFrame = 0
  mode = autoSpin ? 'intro' : 'idle'
  if (autoSpin) applyAzimuth(-INTRO_SWEEP) // 首帧前先就位，避免闪一下静止态
  rafId = requestAnimationFrame(frame)

  return {
    /** 暂停自转（hover 用）；保留当前角度 */
    pause() {
      if (mode === 'idle' || mode === 'intro') mode = 'paused'
    },
    /** 从当前视角恢复自转 */
    resume() {
      if (mode !== 'paused') return
      captureRest()
      azimuth = 0
      lastFrame = 0
      mode = 'idle'
    },
    /** 模型切换 / 重新加载后重放入场动画 */
    restart() {
      if (disposed) return
      captureRest()
      azimuth = 0
      parallax = { x: 0, y: 0 }
      introStart = performance.now()
      lastFrame = 0
      mode = autoSpin ? 'intro' : 'idle'
    },
    /** hover 视差：x/y ∈ [-1,1]，内部映射到小幅弧度（T4.4） */
    setParallax(x, y) {
      parallax = {
        x: Math.max(-1, Math.min(1, x || 0)) * PARALLAX_MAX,
        y: Math.max(-1, Math.min(1, y || 0)) * PARALLAX_MAX,
      }
    },
    /** 当前相机真实方位角（度，0-360）— T4.2 orbit readout 用 */
    getAzimuth() {
      try {
        const cam = viewer.GetCamera()
        const up = normalize(cam.up)
        const off = {
          x: cam.eye.x - cam.center.x,
          y: cam.eye.y - cam.center.y,
          z: cam.eye.z - cam.center.z,
        }
        const ref = Math.abs(up.y) < 0.9 ? { x: 0, y: 1, z: 0 } : { x: 1, y: 0, z: 0 }
        const u = normalize({
          x: up.y * ref.z - up.z * ref.y,
          y: up.z * ref.x - up.x * ref.z,
          z: up.x * ref.y - up.y * ref.x,
        })
        const w = {
          x: up.y * u.z - up.z * u.y,
          y: up.z * u.x - up.x * u.z,
          z: up.x * u.y - up.y * u.x,
        }
        const angle = Math.atan2(
          off.x * w.x + off.y * w.y + off.z * w.z,
          off.x * u.x + off.y * u.y + off.z * u.z,
        )
        return (angle * RAD_TO_DEG + 360) % 360
      } catch {
        return 0
      }
    },
    /** 当前相机俯仰角（度，-90..90）— T4.2 orbit readout 用 */
    getElevation() {
      try {
        const cam = viewer.GetCamera()
        const up = normalize(cam.up)
        const off = normalize({
          x: cam.eye.x - cam.center.x,
          y: cam.eye.y - cam.center.y,
          z: cam.eye.z - cam.center.z,
        })
        const dot = Math.max(-1, Math.min(1, off.x * up.x + off.y * up.y + off.z * up.z))
        return Math.asin(dot) * RAD_TO_DEG
      } catch {
        return 0
      }
    },
    dispose() {
      disposed = true
      if (rafId) cancelAnimationFrame(rafId)
      if (resumeTimer) clearTimeout(resumeTimer)
      resizeObs?.disconnect()
      canvas.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('pointerup', onInteractEnd)
      window.removeEventListener('pointercancel', onInteractEnd)
      canvas.removeEventListener('wheel', onWheel)
    },
  }
}
