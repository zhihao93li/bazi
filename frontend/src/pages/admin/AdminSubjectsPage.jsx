import { useState } from 'react';
import { Table, Input, Card, Drawer, Descriptions, Tag, Select, Space, message } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { getSubjects, getSubject } from '../../services/adminApi';

const genderMap = {
  male: '男',
  female: '女',
};

const calendarTypeMap = {
  solar: '阳历',
  lunar: '农历',
};

const relationshipMap = {
  self: '本人',
  family: '家人',
  friend: '朋友',
  other: '其他',
};

export default function AdminSubjectsPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [search, setSearch] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-subjects', page, pageSize, search],
    queryFn: () => getSubjects({ page, pageSize, search }),
  });

  const { data: subjectDetail, isLoading: detailLoading } = useQuery({
    queryKey: ['admin-subject', selectedSubjectId],
    queryFn: () => getSubject(selectedSubjectId),
    enabled: !!selectedSubjectId,
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
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '性别',
      dataIndex: 'gender',
      key: 'gender',
      render: (text) => genderMap[text] || text,
    },
    {
      title: '出生日期',
      key: 'birthDate',
      render: (_, record) => (
        <span>
          {record.birthYear}-{String(record.birthMonth).padStart(2, '0')}-{String(record.birthDay).padStart(2, '0')}
          {' '}
          {String(record.birthHour).padStart(2, '0')}:{String(record.birthMinute).padStart(2, '0')}
          {' '}
          <Tag>{calendarTypeMap[record.calendarType]}</Tag>
        </span>
      ),
    },
    {
      title: '出生地点',
      dataIndex: 'location',
      key: 'location',
      ellipsis: true,
    },
    {
      title: '所属用户',
      key: 'user',
      render: (_, record) => record.user?.username || record.user?.phone || '-',
    },
    {
      title: '解读数',
      dataIndex: 'themeAnalysesCount',
      key: 'themeAnalysesCount',
    },
    {
      title: '创建时间',
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
    setSelectedSubjectId(id);
    setDrawerOpen(true);
  };

  const handleSearch = (value) => {
    setSearch(value);
    setPage(1);
  };

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>命盘管理</h2>
      <Card style={{ marginBottom: 16 }}>
        <Input.Search
          placeholder="搜索姓名"
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
        title="命盘详情"
        width={600}
        open={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          setSelectedSubjectId(null);
        }}
        loading={detailLoading}
      >
        {subjectDetail?.data && (
          <Descriptions column={1} bordered>
            <Descriptions.Item label="命盘 ID">
              {subjectDetail.data.id}
            </Descriptions.Item>
            <Descriptions.Item label="姓名">
              {subjectDetail.data.name}
            </Descriptions.Item>
            <Descriptions.Item label="性别">
              {genderMap[subjectDetail.data.gender] || subjectDetail.data.gender}
            </Descriptions.Item>
            <Descriptions.Item label="历法">
              {calendarTypeMap[subjectDetail.data.calendarType]}
            </Descriptions.Item>
            <Descriptions.Item label="出生日期">
              {subjectDetail.data.birthYear}-{String(subjectDetail.data.birthMonth).padStart(2, '0')}-{String(subjectDetail.data.birthDay).padStart(2, '0')}
              {' '}
              {String(subjectDetail.data.birthHour).padStart(2, '0')}:{String(subjectDetail.data.birthMinute).padStart(2, '0')}
              {subjectDetail.data.isLeapMonth && <Tag color="orange" style={{ marginLeft: 8 }}>闰月</Tag>}
            </Descriptions.Item>
            <Descriptions.Item label="出生地点">
              {subjectDetail.data.location}
            </Descriptions.Item>
            <Descriptions.Item label="与用户关系">
              {relationshipMap[subjectDetail.data.relationship] || subjectDetail.data.relationship || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="备注">
              {subjectDetail.data.note || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="所属用户">
              {subjectDetail.data.user?.username || subjectDetail.data.user?.phone || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="已解锁主题">
              {subjectDetail.data.themeAnalyses?.length > 0 ? (
                <Space wrap>
                  {subjectDetail.data.themeAnalyses.map((a) => (
                    <Tag key={a.id} color="blue">{a.theme}</Tag>
                  ))}
                </Space>
              ) : (
                '-'
              )}
            </Descriptions.Item>
            <Descriptions.Item label="创建时间">
              {new Date(subjectDetail.data.createdAt).toLocaleString('zh-CN')}
            </Descriptions.Item>
            <Descriptions.Item label="更新时间">
              {new Date(subjectDetail.data.updatedAt).toLocaleString('zh-CN')}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Drawer>
    </div>
  );
}
