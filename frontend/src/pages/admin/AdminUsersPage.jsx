import { useState } from 'react';
import { Table, Input, Card, Drawer, Descriptions, Tag, message } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { getUsers, getUser } from '../../services/adminApi';

export default function AdminUsersPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [search, setSearch] = useState('');
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', page, pageSize, search],
    queryFn: () => getUsers({ page, pageSize, search }),
  });

  const { data: userDetail, isLoading: detailLoading } = useQuery({
    queryKey: ['admin-user', selectedUserId],
    queryFn: () => getUser(selectedUserId),
    enabled: !!selectedUserId,
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
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
      render: (text) => text || '-',
    },
    {
      title: '手机号',
      dataIndex: 'phone',
      key: 'phone',
      render: (text) => text || '-',
    },
    {
      title: '积分余额',
      dataIndex: 'balance',
      key: 'balance',
    },
    {
      title: '命盘数',
      dataIndex: 'subjectsCount',
      key: 'subjectsCount',
    },
    {
      title: '解读数',
      dataIndex: 'themeAnalysesCount',
      key: 'themeAnalysesCount',
    },
    {
      title: '订单数',
      dataIndex: 'ordersCount',
      key: 'ordersCount',
    },
    {
      title: '注册时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (text) => new Date(text).toLocaleString('zh-CN'),
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
    setSelectedUserId(id);
    setDrawerOpen(true);
  };

  const handleSearch = (value) => {
    setSearch(value);
    setPage(1);
  };

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>用户管理</h2>
      <Card style={{ marginBottom: 16 }}>
        <Input.Search
          placeholder="搜索用户名或手机号"
          allowClear
          enterButton={<SearchOutlined />}
          onSearch={handleSearch}
          style={{ width: 300 }}
        />
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
        title="用户详情"
        width={600}
        open={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          setSelectedUserId(null);
        }}
        loading={detailLoading}
      >
        {userDetail?.data && (
          <Descriptions column={1} bordered>
            <Descriptions.Item label="用户 ID">
              {userDetail.data.id}
            </Descriptions.Item>
            <Descriptions.Item label="用户名">
              {userDetail.data.username || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="手机号">
              {userDetail.data.phone || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="积分余额">
              <Tag color="blue">{userDetail.data.balance}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="命盘数">
              {userDetail.data.subjectsCount}
            </Descriptions.Item>
            <Descriptions.Item label="解读数">
              {userDetail.data.themeAnalysesCount}
            </Descriptions.Item>
            <Descriptions.Item label="订单数">
              {userDetail.data.ordersCount}
            </Descriptions.Item>
            <Descriptions.Item label="交易记录数">
              {userDetail.data.transactionsCount}
            </Descriptions.Item>
            <Descriptions.Item label="注册时间">
              {new Date(userDetail.data.createdAt).toLocaleString('zh-CN')}
            </Descriptions.Item>
            <Descriptions.Item label="更新时间">
              {new Date(userDetail.data.updatedAt).toLocaleString('zh-CN')}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Drawer>
    </div>
  );
}
