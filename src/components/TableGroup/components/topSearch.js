import React, { useEffect, useState } from 'react';
import { Col, Row, Space } from 'antd';
import { CloseOutlined, SortAscendingOutlined } from '@ant-design/icons';
import { cloneDeep } from 'lodash';
import SyncOutlined from '@ant-design/icons/lib/icons/SyncOutlined';

const baseStyle = {
  master: {
    marginBottom: '6px',
    background: '#fff',
    padding: '11px',
  },
  span: {
    marginRight: '20px',
    cursor: 'pointer',
    color: '#4495f4',
  },
  searchTag: {
    display: 'inline-block',
    borderRadius: '15px',
    border: 'solid 1px #bcc3cf',
    padding: '3px 40px 3px 10px',
    position: 'relative',
    marginLeft: '10px',
    // 'width': '100px'
  },
  searchCloseIcon: {
    cursor: 'pointer',
    float: 'right',
    top: '50%',
    fontSize: '12px',
    position: 'absolute',
    marginTop: '-6px',
    right: '12px',
    color: '#a0a0a0',
  },
  refreshIcon: {
    color: '#4495f4',
    fontSize: '14px',
    cursor: 'pointer',
  },
};
export default function TopSearch(props) {
  const [searchTag, setSearchTag] = useState([]);
  const [uploadRef, setUploadRef] = useState(null);

  useEffect(() => {
    if (props.searchTags) {
      setSearchTag([...props.searchTags]);
    }
    // setSearchTag([...props.searchTags]);
  }, [props.searchTags]);

  /**
   * 添加搜索标签
   * @param data
   */
  const addSearchTag = tagObj => {
    const arr = cloneDeep(searchTag);
    arr.push(tagObj);
    setSearchTag(tagObj);
  };

  /**
   * 根据下标来删除导航标签
   * @param index
   */
  const deleteSearchTag = index => {
    const arr = cloneDeep(searchTag);
    arr.splice(index, 1);
    props.deleteSearchTags(index); // 触发父组件 删除某个筛选
    setSearchTag(arr);
  };

  const refresh = () => {
    const { refreshTable } = props;
    if (refreshTable) refreshTable();
  };

  const refreshDom = (
    <div style={baseStyle.refreshIcon} onClick={refresh}>
      <SyncOutlined /> 刷新
    </div>
  );

  return (
    <div className="search-header animate__animated animate__fadeIn" style={baseStyle.master}>
      <Row>
        <Col span={16} style={{display: 'flex'}}>
          {searchTag.map((item, index) =>
            item.value.length > 0 ? (
              <Space key={item.key}>
                <div
                  className="search-tag animate__animated animate__slideInUp"
                  style={baseStyle.searchTag}
                >
                  {item.icon ? item.icon : ''}
                  <span className="sea-title">{item.title}：</span>
                  <span className="sea-info">
                    {Array.isArray(item.value) ? item.value.join(',') : item.value}
                  </span>
                  <CloseOutlined
                    style={baseStyle.searchCloseIcon}
                    onClick={() => {
                      deleteSearchTag(index);
                    }}
                  />
                </div>
              </Space>
            ) : (
              ''
            ),
          )}
        </Col>
        <Col span={8} style={{ textAlign: 'right' }}>
          <Space>
            {props.dynSolt ? props.dynSolt() : ''}
            {/*{refreshDom}*/}
            {/*个人信息*/}
          </Space>
        </Col>
      </Row>
    </div>
  );
}
