/**
 * framer-motion 按需加载优化
 * 使用 LazyMotion + domAnimation 减少首次加载体积
 * 原来全量导入约 112KB，按需加载后约 20-30KB
 */
import { LazyMotion, domAnimation } from 'framer-motion'

export default function MotionProvider({ children }) {
  return (
    <LazyMotion features={domAnimation} strict>
      {children}
    </LazyMotion>
  )
}
