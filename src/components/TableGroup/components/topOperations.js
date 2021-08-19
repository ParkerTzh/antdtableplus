import React, { useContext, useEffect, useState } from 'react';
import Button from 'antd/es/button';
import { Space, Modal, message } from 'antd';
import xlsx from 'node-xlsx'; // eslint-disable-line
import moment from 'moment';
import download from 'downloadjs';
import {
  DeleteOutlined,
  ExportOutlined,
  CopyOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import { isNumber } from '@/utils/utils';
import { MyTableContext } from '@/components/TableGroup/Context/MyTableContext';

const { confirm } = Modal;

export default function TopOperations(props) {
  const [selectedRows, setSelectRows] = useState([]);
  const [exportColumns, setExportColumns] = useState([]);
  let options = [];
  const context = useContext(MyTableContext);

  // 操作按钮控制  如删除
  if (context && context.operation) {
    if (context.operation.buttons) options = [...context.operation.buttons];
  }

  useEffect(() => {
    setSelectRows([...props.selectedRows]);
  }, [props.selectedRows]);

  useEffect(() => {
    setExportColumns([...props.exportColumns]);
  }, [props.exportColumns]);

  const handleDelete = () => {
    // 删除行
    confirm({
      title: '删除?',
      icon: <ExclamationCircleOutlined />,
      content: '确定执行删除操作',
      onOk() {
        const ids = selectedRows.map(item => item.id);
        props.handleDelete(ids);
      },
      onCancel() {
        console.log('Cancel');
      },
    });
  };

  const exportRows = () => {
    // 导出数据
    const xlsxlist = [];
    const headerMap = [];
    const xlsxHeader = []; // 导出的文件头
    exportColumns.forEach(item => {
      xlsxHeader.push(item.title);
      headerMap.push({
        dataIndex: item.dataIndex,
        title: item.title,
      });
    });
    xlsxlist.push(xlsxHeader);
    selectedRows.forEach(item => {
      const xlsxBody = []; // 导出的文件内容
      Object.keys(item).forEach(key => {
        const findInx = headerMap.findIndex(itm => itm.dataIndex === key);
        if (findInx > -1) {
          if (isNumber(item[key])) {
            // 避免导出无法进行求和
            item[key] = parseFloat(item[key]);
          }
          xlsxBody[findInx] = item[key];
        }
      });
      xlsxlist.push(xlsxBody);
    });
    console.log('xlsxlist', xlsxlist);
    const buffer = xlsx.build([
      {
        name: `${moment().format('YYYY-MM-DD HH:mm:ss')}.xlsx`,
        data: xlsxlist,
      },
    ]);
    const blob = new Blob([buffer], { type: 'text/plain;charset=utf-8' });
    download(blob, `${document.title}${moment().format('YYYY-MM-DD HH:mm:ss')}.xlsx`);
  };

  const copyRowsAdd = () => {
    // 复制新增
    if (selectedRows.length === 1) {
      // message.success('复制新增');
      props.addRow(1);
    } else {
      message.error('你最多只能选择一条数据进行复制！');
    }
  };
  return (
    <div className="top-operations animate__animated animate__fadeIn">
      <span className="checked-num">已勾选 {selectedRows.length} 项</span>
      <div className="btn-group">
        <Space>
          {options.indexOf('delete') > -1 && (
            <Button
              onClick={handleDelete}
              type="default"
              shape="round"
              icon={<DeleteOutlined />}
              size={16}
            >
              删除
            </Button>
          )}
          <Button
            onClick={exportRows}
            type="default"
            shape="round"
            icon={<ExportOutlined />}
            size={16}
          >
            导出
          </Button>
          {props.copyAdd ? (
            <Button
              onClick={copyRowsAdd}
              type="default"
              shape="round"
              icon={<CopyOutlined />}
              size={16}
            >
              复制新增
            </Button>
          ) : (
            ''
          )}
          {props.slot
            ? props.slot.map(item => (
                <Button key={item.key} onClick={item.func} type="default" shape="round" size={16}>
                  {item.title}
                </Button>
              ))
            : ''}
        </Space>
      </div>
      {/*<div className="" style={{ float: 'right' }}>*/}
      {/*  <Avatar />*/}
      {/*</div>*/}
    </div>
  );
}
