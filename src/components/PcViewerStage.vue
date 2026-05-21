<script setup>
/**
 * PcViewerStage — PC studio 左侧 viewer 容器
 *
 * Spec: docs/design/specs/p3.4-pc-goods-detail.md §3 (B3L)
 * Anchor: cd-4-desktop.html line 1157-1472 (.viewer)
 *
 * 结构 (4 canvas-corner + 5 命名 slot + default render slot):
 *  - 4 canvas-corner (tl/tr/bl/br, 装饰)
 *  - slot="breadcrumb" (顶左)
 *  - slot="scale-bar" (顶中)
 *  - slot="controls" (顶右, 浮动控件)
 *  - slot="toggle" (左下浮)
 *  - slot="variants" (左中下)
 *  - slot="axis" (右下)
 *  - default slot: render-stage (3D viewer / SVG art mount)
 *
 * 设计原则: 纯展示容器, 不引入 3D 库依赖. canvasRef 暴露给调用方挂载 viewer.
 */
import { ref } from 'vue'

const canvasRef = ref(null)
defineExpose({ canvasRef })
</script>

<template>
  <div class="pc-viewer-stage">
    <!-- 4 canvas corners -->
    <span class="pc-viewer-stage__corner pc-viewer-stage__corner--tl" aria-hidden="true" />
    <span class="pc-viewer-stage__corner pc-viewer-stage__corner--tr" aria-hidden="true" />
    <span class="pc-viewer-stage__corner pc-viewer-stage__corner--bl" aria-hidden="true" />
    <span class="pc-viewer-stage__corner pc-viewer-stage__corner--br" aria-hidden="true" />

    <!-- top-left breadcrumb -->
    <div v-if="$slots.breadcrumb" class="pc-viewer-stage__breadcrumb">
      <slot name="breadcrumb" />
    </div>

    <!-- top-center scale-bar -->
    <div v-if="$slots['scale-bar']" class="pc-viewer-stage__scale">
      <slot name="scale-bar" />
    </div>

    <!-- top-right controls -->
    <div v-if="$slots.controls" class="pc-viewer-stage__controls">
      <slot name="controls" />
    </div>

    <!-- bottom-left toggle -->
    <div v-if="$slots.toggle" class="pc-viewer-stage__toggle">
      <slot name="toggle" />
    </div>

    <!-- left-middle-bottom variants -->
    <div v-if="$slots.variants" class="pc-viewer-stage__variants">
      <slot name="variants" />
    </div>

    <!-- bottom-right axis -->
    <div v-if="$slots.axis" class="pc-viewer-stage__axis">
      <slot name="axis" />
    </div>

    <!-- default render slot: 3D viewer / SVG art -->
    <div ref="canvasRef" class="pc-viewer-stage__render">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.pc-viewer-stage {
  position: relative;
  background: var(--paper);
  border: 1.5px solid var(--ink);
  height: 720px;
  overflow: hidden;
}

/* tighter inner grid */
.pc-viewer-stage::before {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  background-image:
    linear-gradient(to right, rgba(20, 21, 15, 0.06) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(20, 21, 15, 0.06) 1px, transparent 1px);
  background-size: 32px 32px;
  background-position: 16px 16px;
  -webkit-mask-image: radial-gradient(85% 75% at 50% 50%, #000 0%, transparent 100%);
  mask-image: radial-gradient(85% 75% at 50% 50%, #000 0%, transparent 100%);
  z-index: 1;
}

/* chartreuse wash behind subject */
.pc-viewer-stage::after {
  content: "";
  position: absolute;
  inset: 35% 20% 10% 20%;
  pointer-events: none;
  background: radial-gradient(closest-side, rgba(212, 242, 58, 0.20), transparent 70%);
  z-index: 1;
}

/* ===== Canvas corners ===== */
.pc-viewer-stage__corner {
  position: absolute;
  width: 18px;
  height: 18px;
  border: 1.5px solid var(--accent-link);
  z-index: 3;
}
.pc-viewer-stage__corner--tl { top: 14px; left: 14px; border-right: 0; border-bottom: 0; }
.pc-viewer-stage__corner--tr { top: 14px; right: 14px; border-left: 0; border-bottom: 0; }
.pc-viewer-stage__corner--bl { bottom: 14px; left: 14px; border-right: 0; border-top: 0; }
.pc-viewer-stage__corner--br { bottom: 14px; right: 14px; border-left: 0; border-top: 0; }

/* ===== Overlay slots ===== */
.pc-viewer-stage__breadcrumb {
  position: absolute;
  top: 20px;
  left: 32px;
  z-index: 4;
}

.pc-viewer-stage__scale {
  position: absolute;
  top: 22px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 4;
}

.pc-viewer-stage__controls {
  position: absolute;
  top: 56px;
  right: 32px;
  z-index: 4;
}

.pc-viewer-stage__toggle {
  position: absolute;
  bottom: 32px;
  left: 32px;
  z-index: 4;
}

.pc-viewer-stage__variants {
  position: absolute;
  bottom: 88px;
  left: 32px;
  z-index: 4;
}

.pc-viewer-stage__axis {
  position: absolute;
  bottom: 32px;
  right: 32px;
  z-index: 4;
}

/* ===== Render slot ===== */
.pc-viewer-stage__render {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2;
}
.pc-viewer-stage__render :deep(svg),
.pc-viewer-stage__render :deep(canvas) {
  width: 100%;
  height: 100%;
  display: block;
}
</style>
