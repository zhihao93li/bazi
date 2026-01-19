import { useState } from 'react';
import { Table, Input, Card, Drawer, Descriptions, Tag, Select, Space, message } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { getPaymentOrders, getPaymentOrder } from '../../services/adminApi';

const statusColors = {
  pending: 'default',
  paid: 'success',
  failed: 'error',
  refunded: 'warning',
};

const statusLabels = {
  pending: '待支付',
  paid: '已支付',
  failed: '失败',
  refunded: '已退款',
};

const paymentMethodLabels = {
  stripe: 'Stripe',
  alipay_qrcode: '支付宝扫码',
  alipay_h5: '支付宝 H5',
};

export default function AdminPaymentOrdersPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [status, setStatus] = useState('');
  const [orderNo, setOrderNo] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-payment-orders', page, pageSize, status, orderNo],
    queryFn: () => getPaymentOrders({
      page,
      pageSize,
      status: status || undefined,
      orderNo: orderNo || undefined,
    }),
  });

  const { data: detail, isLoading: detailLoading } = useQuery({
    queryKey: ['admin-payment-order', selectedId],
    queryFn: () => getPaymentOrder(selectedId),
    enabled: !!selectedId,
  });

  const columns = [
    {
      title: '订单号',
      dataIndex: 'orderNo',
      key: 'orderNo',
      width: 200,
    },
    {
      title: '用户',
      key: 'user',
      render: (_, record) => record.user?.username || record.user?.phone || '-',
    },
    {
      title: '金额（元）',
      dataIndex: 'amount',
      key: 'amount',
      render: (text) => (text / 100).toFixed(2),
    },
    {
      title: '积分',
      dataIndex: 'points',
      key: 'points',
    },
    {
      title: '支付方式',
      dataIndex: 'paymentMethod',
      key: 'paymentMethod',
      render: (text) => paymentMethodLabels[text] || text,
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
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (text) => new Date(text).toLocaleString('zh-CN'),
    },
    {
      title: '支付时间',
      dataIndex: 'paidAt',
      key: 'paidAt',
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
    setSelectedId(id);
    setDrawerOpen(true);
  };

  const handleSearch = (value) => {
    setOrderNo(value);
    setPage(1);
  };

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>充值记录</h2>
      <Card style={{ marginBottom: 16 }}>
        <Space wrap>
          <Input.Search
            placeholder="搜索订单号"
            allowClear
            enterButton={<SearchOutlined />}
            onSearch={handleSearch}
            style={{ width: 250 }}
          />
          <span>状态筛选：</span>
          <Select
            placeholder="全部状态"
            allowClear
            style={{ width: 120 }}
            value={status || undefined}
            onChange={(value) => {
              setStatus(value || '');
              setPage(1);
            }}
            options={Object.entries(statusLabels).map(([value, label]) => ({
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
      <Drawer
        title="订单详情"
        width={600}
        open={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          setSelectedId(null);
        }}
        loading={detailLoading}
      >
        {detail?.data && (
          <Descriptions column={1} bordered>
            <Descriptions.Item label="订单 ID">
              {detail.data.id}
            </Descriptions.Item>
            <Descriptions.Item label="订单号">
              {detail.data.orderNo}
            </Descriptions.Item>
            <Descriptions.Item label="用户">
              {detail.data.user?.username || detail.data.user?.phone || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="金额">
              ¥{(detail.data.amount / 100).toFixed(2)}
            </Descriptions.Item>
            <Descriptions.Item label="积分">
              {detail.data.points}
            </Descriptions.Item>
            <Descriptions.Item label="支付方式">
              {paymentMethodLabels[detail.data.paymentMethod] || detail.data.paymentMethod}
            </Descriptions.Item>
            <Descriptions.Item label="状态">
              <Tag color={statusColors[detail.data.status]}>
                {statusLabels[detail.data.status] || detail.data.status}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="交易 ID">
              {detail.data.transactionId || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="Stripe Session ID">
              {detail.data.stripeSessionId || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="创建时间">
              {new Date(detail.data.createdAt).toLocaleString('zh-CN')}
            </Descriptions.Item>
            <Descriptions.Item label="支付时间">
              {detail.data.paidAt ? new Date(detail.data.paidAt).toLocaleString('zh-CN') : '-'}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Drawer>
    </div>
  );
}
