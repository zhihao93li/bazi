import { useState } from 'react';
import { Table, Card, Tag, Select, Space, message } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { getPointsTransactions } from '../../services/adminApi';

const typeColors = {
  recharge: 'green',
  consume: 'red',
  gift: 'blue',
};

const typeLabels = {
  recharge: '充值',
  consume: '消费',
  gift: '赠送',
};

export default function AdminPointsTransactionsPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [type, setType] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-points-transactions', page, pageSize, type],
    queryFn: () => getPointsTransactions({ page, pageSize, type: type || undefined }),
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
      title: '用户',
      key: 'user',
      render: (_, record) => record.user?.username || record.user?.phone || '-',
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (text) => (
        <Tag color={typeColors[text]}>{typeLabels[text] || text}</Tag>
      ),
    },
    {
      title: '积分变动',
      dataIndex: 'amount',
      key: 'amount',
      render: (text, record) => (
        <span style={{ color: record.type === 'consume' ? '#cf1322' : '#3f8600' }}>
          {record.type === 'consume' ? '-' : '+'}{Math.abs(text)}
        </span>
      ),
    },
    {
      title: '变动后余额',
      dataIndex: 'balance',
      key: 'balance',
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: '关联订单',
      dataIndex: 'orderId',
      key: 'orderId',
      width: 220,
      ellipsis: true,
      render: (text) => text || '-',
    },
    {
      title: '时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (text) => new Date(text).toLocaleString('zh-CN'),
    },
  ];

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>消费记录</h2>
      <Card style={{ marginBottom: 16 }}>
        <Space>
          <span>类型筛选：</span>
          <Select
            placeholder="全部类型"
            allowClear
            style={{ width: 120 }}
            value={type || undefined}
            onChange={(value) => {
              setType(value || '');
              setPage(1);
            }}
            options={Object.entries(typeLabels).map(([value, label]) => ({
              value,
              label,
            }))}
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
    </div>
  );
}
