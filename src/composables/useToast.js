/**
 * useToast.js —— Toast 提示组合式函数
 * 仅做一层薄封装，实际逻辑在 store.js 的 showToast。
 */
import { showToast } from '../store.js'

export function useToast() {
  return {
    success: (msg, duration) => showToast(msg, 'success', duration),
    error: (msg, duration) => showToast(msg, 'error', duration),
    info: (msg, duration) => showToast(msg, 'info', duration)
  }
}
