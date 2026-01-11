import { useState, useEffect } from 'react';
import { Plus } from '@phosphor-icons/react';
import SubjectCard from '../components/subject/SubjectCard';
import SubjectForm from '../components/subject/SubjectForm';
import Modal from '../components/common/Modal';
import { useToast } from '../components/common';
import { mockSubjects } from '../mock/subjects';
import styles from './SubjectsPage.module.css';

// Simple mock data persistence
const STORAGE_KEY = 'bazi_subjects';

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);
  const toast = useToast();

  // Load initial data
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      setSubjects(JSON.parse(saved));
    } else {
      setSubjects(mockSubjects || []); 
    }
  }, []);

  // Save changes
  useEffect(() => {
    if (subjects.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(subjects));
    }
  }, [subjects]);

  const handleAdd = () => {
    setEditingSubject(null);
    setIsModalOpen(true);
  };

  const handleEdit = (subject) => {
    setEditingSubject(subject);
    setIsModalOpen(true);
  };

  const handleDelete = (subject) => {
    if (confirm(`确定要删除 ${subject.name} 吗？`)) {
      setSubjects(prev => prev.filter(s => s.id !== subject.id));
      toast.success('删除成功');
    }
  };

  const handleSubmit = (formData) => {
    if (editingSubject) {
      // Update
      setSubjects(prev => prev.map(s => 
        s.id === editingSubject.id ? { ...formData, id: s.id } : s
      ));
      toast.success('更新成功');
    } else {
      // Create
      const newSubject = {
        ...formData,
        id: `subject-${Date.now()}`
      };
      setSubjects(prev => [...prev, newSubject]);
      toast.success('添加成功');
    }
    setIsModalOpen(false);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>测算对象管理</h1>
        <button className={styles.addButton} onClick={handleAdd}>
          <Plus size={20} />
          添加对象
        </button>
      </div>

      {subjects.length === 0 ? (
        <div className={styles.emptyState}>
          <p>暂无对象，请添加</p>
        </div>
      ) : (
        <div className={styles.grid}>
          {subjects.map(subject => (
            <SubjectCard
              key={subject.id}
              subject={subject}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingSubject ? '编辑对象' : '添加对象'}
      >
        <SubjectForm
          initialValues={editingSubject}
          onSubmit={handleSubmit}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>
    </div>
  );
}
