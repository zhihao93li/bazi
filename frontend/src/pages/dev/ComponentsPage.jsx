import { useState } from 'react'
import { 
  FormInput, 
  FormSelect, 
  Card, 
  ButtonGroup, 
  Modal, 
  useToast,
  Checkbox 
} from '../../components/common'
import Button from '../../components/Button'
import Tag from '../../components/Tag'
import styles from './ComponentsPage.module.css'

export default function ComponentsPage() {
  const toast = useToast()
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    gender: 'female',
    city: '',
    agree: false,
  })
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [errors, setErrors] = useState({})

  const handleChange = (e) => {
    const { name, value, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: checked !== undefined ? checked : value
    }))
  }

  const genderOptions = [
    { value: 'male', label: '男' },
    { value: 'female', label: '女' },
  ]

  const cityOptions = [
    { value: 'beijing', label: '北京' },
    { value: 'shanghai', label: '上海' },
    { value: 'guangzhou', label: '广州' },
    { value: 'shenzhen', label: '深圳' },
  ]

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <h1 className={styles.title}>组件展示页</h1>
        <p className={styles.subtitle}>基础 UI 组件库预览</p>

        {/* Button 组件 */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Button 按钮</h2>
          <div className={styles.row}>
            <Button variant="primary">Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
          </div>
          <div className={styles.row}>
            <Button size="small">Small</Button>
            <Button size="medium">Medium</Button>
            <Button size="large">Large</Button>
          </div>
        </section>

        {/* Tag 组件 */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Tag 标签</h2>
          <div className={styles.row}>
            <Tag>Default</Tag>
            <Tag color="red">Red</Tag>
            <Tag color="purple">Purple</Tag>
            <Tag color="green">Green</Tag>
            <Tag color="orange">Orange</Tag>
            <Tag color="blue">Blue</Tag>
          </div>
        </section>

        {/* FormInput 组件 */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>FormInput 输入框</h2>
          <div className={styles.formRow}>
            <FormInput
              label="用户名"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="请输入用户名"
              required
            />
            <FormInput
              label="邮箱"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="请输入邮箱"
            />
          </div>
          <div className={styles.formRow}>
            <FormInput
              label="错误状态"
              name="errorDemo"
              value=""
              onChange={() => {}}
              placeholder="这是错误状态"
              error="请输入正确的内容"
            />
            <FormInput
              label="禁用状态"
              name="disabledDemo"
              value="禁用的内容"
              onChange={() => {}}
              disabled
            />
          </div>
        </section>

        {/* FormSelect 组件 */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>FormSelect 下拉选择</h2>
          <div className={styles.formRow}>
            <FormSelect
              label="选择城市"
              name="city"
              value={formData.city}
              onChange={handleChange}
              options={cityOptions}
              placeholder="请选择城市"
            />
            <FormSelect
              label="禁用状态"
              name="disabledSelect"
              value="beijing"
              onChange={() => {}}
              options={cityOptions}
              disabled
            />
          </div>
        </section>

        {/* ButtonGroup 组件 */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>ButtonGroup 按钮组</h2>
          <div className={styles.row}>
            <ButtonGroup
              options={genderOptions}
              value={formData.gender}
              onChange={handleChange}
              name="gender"
            />
          </div>
          <div className={styles.row}>
            <ButtonGroup
              options={genderOptions}
              value={formData.gender}
              onChange={handleChange}
              name="gender"
              variant="light"
              size="large"
            />
          </div>
        </section>

        {/* Checkbox 组件 */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Checkbox 复选框</h2>
          <div className={styles.row}>
            <Checkbox
              label="我同意用户协议"
              name="agree"
              checked={formData.agree}
              onChange={handleChange}
            />
            <Checkbox
              label="禁用状态"
              name="disabled"
              checked={true}
              onChange={() => {}}
              disabled
            />
          </div>
        </section>

        {/* Card 组件 */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Card 卡片</h2>
          <div className={styles.cardGrid}>
            <Card padding="medium">
              <h3>默认卡片</h3>
              <p>这是一个默认样式的卡片</p>
            </Card>
            <Card variant="outlined" padding="medium">
              <h3>边框卡片</h3>
              <p>这是一个带边框的卡片</p>
            </Card>
            <Card variant="gradient" padding="medium">
              <h3>渐变边框卡片</h3>
              <p>这是一个渐变边框的卡片</p>
            </Card>
            <Card hover padding="medium">
              <h3>悬浮效果卡片</h3>
              <p>鼠标悬浮会有上浮效果</p>
            </Card>
          </div>
        </section>

        {/* Modal 组件 */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Modal 弹窗</h2>
          <Button onClick={() => setIsModalOpen(true)}>打开弹窗</Button>
          <Modal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            title="弹窗标题"
          >
            <p style={{ marginBottom: 20 }}>这是弹窗的内容区域，可以放置任何内容。</p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <Button variant="ghost" onClick={() => setIsModalOpen(false)}>取消</Button>
              <Button onClick={() => setIsModalOpen(false)}>确定</Button>
            </div>
          </Modal>
        </section>

        {/* Toast 组件 */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Toast 消息提示</h2>
          <div className={styles.row}>
            <Button onClick={() => toast.success('操作成功！')}>Success</Button>
            <Button onClick={() => toast.error('操作失败！')}>Error</Button>
            <Button onClick={() => toast.warning('警告信息')}>Warning</Button>
            <Button onClick={() => toast.info('提示信息')}>Info</Button>
          </div>
        </section>
      </div>
    </div>
  )
}
