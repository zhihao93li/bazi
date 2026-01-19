import { useState } from 'react';
import { Table, Card, Drawer, Descriptions, Tag, Select, Space, message } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { getTasks, getTask } from '../../services/adminApi';

const statusColors = {
  pending: 'default',
  processing: 'processing',
  completed: 'success',
  failed: 'error',
};

const statusLabels = {
  pending: '待处理',
  processing: '处理中',
  completed: '已完成',
  failed: '失败',
};

export default function AdminTasksPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [status, setStatus] = useState('');
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-tasks', page, pageSize, status],
    queryFn: () => getTasks({ page, pageSize, status: status || undefined }),
  });

  const { data: taskDetail, isLoading: detailLoading } = useQuery({
    queryKey: ['admin-task', selectedTaskId],
    queryFn: () => getTask(selectedTaskId),
    enabled: !!selectedTaskId,
  });

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 220,
      ellipsis: true,
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (text) => (
        <Tag color={statusColors[text]}>{statusLabels[text] || text}</Tag>
      ),
    },
    {
      title: '用户 ID',
      dataIndex: 'userId',
      key: 'userId',
      width: 220,
      ellipsis: true,
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (text) => new Date(text).toLocaleString('zh-CN'),
    },
    {
      title: '开始时间',
      dataIndex: 'startedAt',
      key: 'startedAt',
      render: (text) => text ? new Date(text).toLocaleString('zh-CN') : '-',
    },
    {
      title: '完成时间',
      dataIndex: 'completedAt',
      key: 'completedAt',
      render: (text) => text ? new Date(text).toLocaleString('zh-CN') : '-',
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <a onClick={() => handleViewDetail(record.id)}>查看详情</a>
      ),
    },
  ];

  const handleViewDetail = (id) => {
    setSelectedTaskId(id);
    setDrawerOpen(true);
  };

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>任务管理</h2>
      <Card style={{ marginBottom: 16 }}>
        <Space>
          <span>状态筛选：</span>
          <Select
            placeholder="全部状态"
            allowClear
            style={{ width: 150 }}
            value={status || undefined}
            onChange={(value) => {
              setStatus(value || '');
              setPage(1);
            }}
            options={[
              { value: 'pending', label: '待处理' },
              { value: 'processing', label: '处理中' },
              { value: 'completed', label: '已完成' },
              { value: 'failed', label: '失败' },
            ]}
          />
        </Space>
      </Card>
      <Table
        columns={columns}
        dataSource={data?.data?.list || []}
        rowKey="id"
        loading={isLoading}
        pagination={{
          current: page,
          pageSize: pageSize,
          total: data?.data?.total || 0,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total) => `共 ${total} 条`,
          onChange: (p, ps) => {
            setPage(p);
            setPageSize(ps);
          },
        }}
      />
      <Drawer
        title="任务详情"
        width={700}
        open={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          setSelectedTaskId(null);
        }}
        loading={detailLoading}
      >
        {taskDetail?.data && (
          <Descriptions column={1} bordered>
            <Descriptions.Item label="任务 ID">
              {taskDetail.data.id}
            </Descriptions.Item>
            <Descriptions.Item label="类型">
              {taskDetail.data.type}
            </Descriptions.Item>
            <Descriptions.Item label="状态">
              <Tag color={statusColors[taskDetail.data.status]}>
                {statusLabels[taskDetail.data.status] || taskDetail.data.status}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="用户 ID">
              {taskDetail.data.userId}
            </Descriptions.Item>
            <Descriptions.Item label="任务参数">
              <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                {JSON.stringify(taskDetail.data.payload, null, 2)}
              </pre>
            </Descriptions.Item>
            {taskDetail.data.result && (
              <Descriptions.Item label="执行结果">
                <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all', maxHeight: 300, overflow: 'auto' }}>
                  {taskDetail.data.result}
                </pre>
              </Descriptions.Item>
            )}
            {taskDetail.data.error && (
              <Descriptions.Item label="错误信息">
                <Tag color="error">{taskDetail.data.error}</Tag>
              </Descriptions.Item>
            )}
            <Descriptions.Item label="创建时间">
              {new Date(taskDetail.data.createdAt).toLocaleString('zh-CN')}
            </Descriptions.Item>
            <Descriptions.Item label="开始时间">
              {taskDetail.data.startedAt ? new Date(taskDetail.data.startedAt).toLocaleString('zh-CN') : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="完成时间">
              {taskDetail.data.completedAt ? new Date(taskDetail.data.completedAt).toLocaleString('zh-CN') : '-'}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Drawer>
    </div>
  );
}
