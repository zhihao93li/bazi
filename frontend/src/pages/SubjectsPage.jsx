import { useState, useEffect } from 'react';
import { Plus } from '@phosphor-icons/react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate
import SubjectCard from '../components/subject/SubjectCard';
import SubjectForm from '../components/subject/SubjectForm';
import Modal from '../components/common/Modal';
import { useToast } from '../components/common';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import GradientBackground from '../components/GradientBackground';
import { api } from '../services/api'; // Import api
import styles from './SubjectsPage.module.css';

export default function SubjectsPage() {
  const navigate = useNavigate();
  const [subjects, setSubjects] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);
  const toast = useToast();

  // Load data from API
  useEffect(() => {
    api.get('/subjects').then(res => {
      setSubjects(res.subjects);
    }).catch(err => {
      // toast.error('加载失败');
    });
  }, []);

  const handleAdd = () => {
    // Redirect to Bazi Input to create new subject via calculation flow
    navigate('/bazi/input');
  };

  const handleEdit = (subject) => {
    setEditingSubject(subject);
    setIsModalOpen(true);
  };

  const handleDelete = async (subject) => {
    if (confirm(`确定要删除 ${subject.name} 吗？`)) {
      try {
        await api.delete(`/subjects/${subject.id}`);
        setSubjects(prev => prev.filter(s => s.id !== subject.id));
        toast.success('删除成功');
      } catch (error) {
        toast.error('删除失败');
      }
    }
  };

  const handleSubmit = async (formData) => {
    if (editingSubject) {
      try {
        // Edit only updates basic info
        const res = await api.put(`/subjects/${editingSubject.id}`, {
          name: formData.name,
          relationship: formData.relationship,
          // gender/birth info updates might require re-calculation, 
          // usually restricted or handled separately. 
          // For now assume simple metadata update or backend handles it.
          // Based on plan: "Edit object (cannot modify baziData, only name etc)"
        });
        setSubjects(prev => prev.map(s => s.id === editingSubject.id ? res.subject : s));
        toast.success('更新成功');
        setIsModalOpen(false);
      } catch (error) {
        toast.error('更新失败');
      }
    }
  };

  const handleView = (subject) => {
    navigate(`/bazi?subjectId=${subject.id}`);
  };

  return (
    <>
      <Navbar />
      <main className={styles.main}>
        {/* Background - Pink/Green for Relationships */}
        <GradientBackground
          gridCount={0}
          glowColors={['rgba(213, 17, 253, 0.2)', 'rgba(39, 179, 44, 0.15)']}
          noiseOpacity={0.1}
          animated
          expanded
        />

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
                  onClick={() => handleView(subject)} // Add click to view
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
      </main>
      <Footer />
    </>
  );
}
