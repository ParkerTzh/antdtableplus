import React, { useContext, useState, useEffect, useRef, useImperativeHandle } from 'react';
import {
  FilterOutlined,
  SortDescendingOutlined,
  SortAscendingOutlined,
  DownCircleOutlined,
  LockOutlined,
  UnlockOutlined,
} from '@ant-design/icons';
import './index.less';
import 'react-resizable/css/styles.css';
import { Resizable } from 'react-resizable';
import Highlighter from 'react-highlight-words';
import CheckboxGroup from 'antd/es/checkbox/Group';
import { clearEmptyStrForArr, columnsExportChild, deepFind, isNumber, sortAZ } from '@/utils/utils';

import {
  Table,
  Form,
  Input,
  Spin,
  Button,
  Space,
  Checkbox,
  Select,
  message,
  Tooltip,
  Typography,
} from 'antd';
import TopSearch from '@/components/TableGroup/components/topSearch';
import TopOperations from '@/components/TableGroup/components/topOperations';
import { cloneDeep } from 'lodash';
import SearchOutlined from '@ant-design/icons/lib/icons/SearchOutlined';
import moment from 'moment';

const { Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;
const EditableContext = React.createContext(null);

let addRowTmp = {
  // 添加行的默认数据，可用作于判断新增的数据是否写值
  id: -1,
  budget: '',
  comment: '',
  deliver_status: '',
  in_charge: '',
  industry: '',
  insert_time: '',
  is_quote: 0,
  oppty_name: '',
  oppty_progress: '',
  oppty_source: '',
  oppty_status: '',
  path: '',
  presale_manager: '',
  product: '',
  product_2rd: '',
  sale_manager: '',
};

// 可拖动
const ResizableTitle = props => {
  const { onResize, width, ...restProps } = props;

  if (!width) {
    return <th {...restProps} />;
  }

  return (
    <Resizable
      width={width}
      height={0}
      handle={
        <span
          className="react-resizable-handle"
          onClick={e => {
            e.stopPropagation();
          }}
        />
      }
      onResize={onResize}
      draggableOpts={{ enableUserSelectHack: false }}
    >
      <th {...restProps} />
    </Resizable>
  );
};

let innerHeight = 500;

const MyTable = props => {
  const [pagination, setPagination] = useState(null);
  const [columns, setColumns] = useState([...props.columns]);
  const [dataSource, setDataSource] = useState([...props.dataSource]);
  const [spinFlg, setSpinFlg] = useState(false);
  const [selectedRowKey, setSelectedRowkey] = useState([]);
  const [selectedRows, setSelectedRows] = useState([]);
  const [searchedColumn, setSearchedColumn] = useState(null);
  const [searchText, setSearchText] = useState(null);
  const [indeterminate, setIndeterminate] = useState(true);
  const [currentEditDataIndex, setCurrentEditDataIndex] = useState(null); // 当前编辑的列
  const [checkAllSC, setCheckAllSC] = useState(false); // 筛选 => 选择全部
  const [checkListSearchColumn, setCheckListSC] = useState([]); // 筛选 => 已选择的项
  const [sortColumnInfo, setSortColumnInfo] = useState({}); // 表格当前sort的列（dataIndex）
  const [searchTags, setSearchTags] = useState([]); // 搜索的tags
  const [addRowType, setAddRowType] = useState(0); // 新增行 类型：0 直接新增新数据， 1 复制新增

  useEffect(() => {
    // 监听props.dataSource的变化，避免dataSource不刷新
    setDataSource(props.dataSource);
  }, [props.dataSource]);

  useEffect(() => {
    // 监听 表格的头部
    setSpinFlg(true);
    if (props.columns.length > 0) {
      setColumns(props.columns);
      setSpinFlg(false);
    }
  }, [props.columns]);

  useEffect(() => {
    const defPagination = {
      ...props.pagination,
      showTotal: total => `共 ${total} 条`,
    };
    // 监听翻页参数
    setPagination(defPagination);
  }, [props.pagination]);

  // 监听选择搜索
  useEffect(() => {
    const params = {}; // 返回父级的搜索参数
    // 只有排序则不做任何处理
    if (searchTags.length === 1 && searchTags.find(itm => itm.key === 'sort')) {
      console.warn('排序，不进行搜索');
    } else {
      searchTags.forEach(item => {
        const { key, value } = item;
        if (key !== 'sort') {
          if (value.length > 0) {
            params[key] = value; // 清除 {xxx: []}搜索长度为0的数据，数组长度为0则不对当前字段进行筛选
          }
        }
      });
      if (props.handleSearch) {
        props.handleSearch(params); // 触发父组件更新
      }
    }
  }, [searchTags]);

  useEffect(() => {
    ({ innerHeight } = window);
  });

  // 行编辑保存 row: 当前最新行数据，beforeRow：编辑前的数据
  const handleSaveCell = (row, beforeRow) => {
    const newData = [...dataSource];
    const index = newData.findIndex(item => row.id === item.id);
    const item = newData[index];
    newData.splice(index, 1, {
      ...item,
      ...row,
    });
    if (row.id > -1) {
      // 修改
      props.handleSaveCell(row, 'update', currentEditDataIndex, beforeRow); // 返回三个参数 row: 当前行数据， update: 当前操作, dataIndex: 当前列
      setDataSource(newData);
    } else if (addRowType === 0) {
      // 新增 新的数据
      if (JSON.stringify(row) === JSON.stringify(addRowTmp)) {
        // 新增一条数据完全没做修改
        message.warn('新增无效，没有数据修改！');
        const defDataSource = cloneDeep(dataSource);
        defDataSource.splice(0, 1);
        setDataSource([...defDataSource]);
      } else {
        delete row.id;
        props.handleSaveCell(row, 'add', currentEditDataIndex, beforeRow);
      }
    } else if (addRowType === 1) {
      // 复制新增
      const match1 = cloneDeep(row);
      const match2 = cloneDeep(selectedRows[0]);
      match2.id = -2;
      if (JSON.stringify(match1) === JSON.stringify(match2)) {
        message.warn('新增无效，没有数据修改！');
        const defDataSource = cloneDeep(dataSource);
        defDataSource.splice(0, 1);
        setDataSource([...defDataSource]);
      } else {
        delete row.id;
        props.handleSaveCell(row, 'add', currentEditDataIndex);
      }
    }
  };

  const getAddRowTmp = () => {
    // 获取添加行的默认数据
    const _Match = {
      number: 0,
      string: '',
      date: new Date().toString(),
      boolean: false,
    };
    const res = props.columns.reduce((pre, cur) => {
      const { typeOf } = cur;
      pre[cur.dataIndex] = typeOf ? _Match[typeOf] : '';
      return pre;
    }, {});
    res.id = -1;
    return res;
  };

  const handleResize = index => (e, { size }) => {
    const nextColumns = [...columns];
    nextColumns[index] = {
      ...nextColumns[index],
      width: size.width,
    };
    setColumns(nextColumns);
  };

  // 可编辑行
  const EditableRow = ({ index, ...props }) => {
    const [form] = Form.useForm();
    return (
      <Form key={index} form={form} component={false}>
        <EditableContext.Provider value={form}>
          <tr {...props} />
        </EditableContext.Provider>
      </Form>
    );
  };

  // 编辑表格
  const EditableCell = ({
    title,
    editable,
    children,
    dataIndex,
    record,
    handleSave,
    type: dataType, // 数据类型
    ...restProps
  }) => {
    const [editing, setEditing] = useState(false);
    const [editBeforeRecord, setEditBeforeRecord] = useState(null); // 编辑前的数据
    const form = useContext(EditableContext);
    const toggleEdit = type => {
      if (props.handleEditing) {
        props.handleEditing(dataIndex, record);
      }
      if (type === 'multiple') {
        const fieldsValue = record[dataIndex] ? record[dataIndex].split(',') : [];
        form.setFieldsValue({
          [dataIndex]: fieldsValue,
        });
      } else {
        form.setFieldsValue({
          [dataIndex]: record[dataIndex],
        });
      }
      setEditing(!editing);
    };
    const inputRef = useRef(null);
    const save = async editable => {
      try {
        const values = await form.validateFields();
        let selectType;
        if (editable[0] === 'select') {
          const [, , type, func] = editable;
          selectType = type;
          if (func) {
            // 判断select是否传入回调函数
            const { handleSelected } = func; // 获取回调函数里的选中方法
            handleSelected(values, record);
          }
        }
        if (selectType === 'multiple') {
          const v = values[Object.keys(values)[0]];
          if (v && v !== '') {
            values[Object.keys(values)[0]] = v.join(',');
          }
        }
        toggleEdit(selectType);
        handleSaveCell({ ...record, ...values }, editBeforeRecord);
      } catch (errInfo) {
        console.log('Save failed:', errInfo);
      }
    };
    useEffect(() => {
      if (editing) {
        setEditBeforeRecord({ ...record }); // 保存编辑前的数据
        try {
          if (!Array.isArray(editable) && editable[0] !== 'select') {
            try {
              if (inputRef.current) {
                inputRef.current.focus();
              }
            } catch (e) {
              console.warn(e);
            }
          }
          setCurrentEditDataIndex(dataIndex);
        } catch (e) {
          console.log(e);
        }
      }
    }, [editing]);

    let childNode = children;

    if (editable) {
      childNode = editing ? (
        <Form.Item
          style={{
            margin: 0,
          }}
          name={dataIndex}
          // rules={[
          //   {
          //     required: true,
          //     message: `${title} is required.`,
          //   },
          // ]}
        >
          {editable[0] === 'select' ? (
            <Select
              mode={editable[2] ? editable[2] : ''}
              ref={inputRef}
              showSearch
              onBlur={() => {
                save(editable);
              }}
              onChange={() => {
                save(editable);
              }}
            >
              {editable[1].map(opts => (
                <Option value={opts} key={opts}>
                  {opts}
                </Option>
              ))}
            </Select>
          ) : dataType === 'number' ? (
            <Input type="number" onPressEnter={save} onBlur={save} />
          ) : (
            <TextArea autoSize ref={inputRef} onPressEnter={save} onBlur={save} />
          )}
        </Form.Item>
      ) : editable[0] !== 'select' ? (
        <div
          className="editable-cell-value-wrap"
          style={{
            paddingRight: 24,
          }}
          onDoubleClick={() => toggleEdit(editable[2])}
        >
          {children}
        </div>
      ) : (
        <div
          className="editable-cell-value-wrap"
          style={{
            paddingRight: 24,
          }}
          onClick={() => toggleEdit(editable[2])}
        >
          {children}
        </div>
      );
    }

    return <td {...restProps}>{childNode}</td>;
  };

  const onSelectRowKeyChange = (selectedRowKeys, selectedRows) => {
    setSelectedRows(selectedRows);
    setSelectedRowkey(selectedRowKeys);
    const { handleCheckData } = props;
    if (handleCheckData) props.handleCheckData(selectedRows);
  };

  const rowSelection = {
    selectedRowKeys: selectedRowKey,
    onChange: onSelectRowKeyChange,
    columnWidth: '63px',
  };

  const handleAddRow = type => {
    // type=1 复制新增 其他直接新增一条新数据
    addRowTmp = getAddRowTmp();
    if (dataSource.find(item => item.id === -1)) {
      message.warn('一次最多只能连续新增一条数据！');
      return;
    }
    let newData;
    if (type === 1) {
      setAddRowType(1);
      newData = cloneDeep(selectedRows[0]);
      newData.id = -2;
    } else {
      setAddRowType(0);
      newData = cloneDeep(addRowTmp);
    }
    setDataSource([newData, ...dataSource]);
  };

  const deleteSearchTags = index => {
    // 根据下标删除某个筛选项
    const defSearchTags = cloneDeep(searchTags);
    defSearchTags.splice(index, 1);
    // props.handleSearch(defSearchTags); // 触发父组件搜索
    setSearchTags([...defSearchTags]);
  };

  const handleDelete = ids => {
    // 删除行数据
    if (props.handleDelete) {
      props.handleDelete(ids);
      const defSelectRows = [...selectedRows];
      defSelectRows.length = 0;
      setSelectedRows([...defSelectRows]);
    } else {
      message.error('此表格暂不支持删除操作！');
    }
  };

  // 锁定列
  const blockColumn = (index, type) => {
    let obj = columns;
    obj = obj.map(col => {
      if (col.dataIndex === index) {
        const news = {
          ...col,
          fixed: type === 1 ? 'left' : false, // 1锁定  0解锁
        };
        return news;
      }
      return { ...col };
    });
    const newSort = Array(obj.length).fill(null);
    obj.reduce((pre, cur) => {
      const defIndex = props.columns.findIndex(itm => itm.dataIndex === cur.dataIndex);
      newSort[defIndex] = cur;
      return cur;
    }, 0);
    const fixedArr = [];
    const noFixedArr = [];
    newSort.reduce((pre, cur) => {
      if (cur?.fixed && cur?.fixed === 'left') {
        fixedArr.push(cur);
      } else {
        noFixedArr.push(cur);
      }
      return cur;
    }, 0);
    obj = [...fixedArr, ...noFixedArr]; // Warning: Index 5 of `columns` missing `fixed='left'` prop.
    setColumns([...obj]);
    message.success(type === 1 ? '锁定成功！' : '取消锁定！');
  };

  // 清除字段所有过滤条件（排序，固定列，以及筛选值）
  const clearFilterForField = dataIndex => {
    blockColumn(dataIndex, 0); // 解除锁定
    // 清除当前筛选值
    const defSearchTags = cloneDeep(searchTags);
    const inx = defSearchTags.findIndex(item => item.key === dataIndex);
    if (inx > -1) {
      defSearchTags.splice(inx, 1);
      setSearchTags([...defSearchTags]);
      setCheckListSC([]);
    }
  };

  // 搜索标签选择
  const handleSearchTags = data => {
    const dfTmp = { title: '排序', key: 'sort' };
    const [dataIndex] = Object.keys(data); // dataIndex的值
    const sortType = data[dataIndex]; // 排序的类型（A-Z ? Z-A）
    let news = {};
    news.icon = sortType === 'A-Z' ? <SortDescendingOutlined /> : <SortAscendingOutlined />;
    const columnsFindTitle = deepFind(columns, dataIndex, 'dataIndex', 'title');
    news.value = `${columnsFindTitle} ${sortType}`;
    news = { ...dfTmp, ...news };
    const searchTagsCur = cloneDeep(searchTags);
    const inx = searchTagsCur.findIndex(item => item.title === '排序');
    if (inx !== -1) {
      searchTagsCur.splice(inx, 1);
    }
    searchTagsCur.push(news);
    setSearchTags(searchTagsCur);
  };

  // 排序
  const sortColumn = (type, dataIndex) => {
    let sortDataSource = [...dataSource];
    sortDataSource = sortAZ(sortDataSource, dataIndex, type);
    if (sortDataSource && sortDataSource.length > 0) {
      setDataSource(sortDataSource);
      const sortObj = {};
      sortObj[dataIndex] = type;
      setSortColumnInfo({ ...sortObj }); // 设置当前已经排序的列
      handleSearchTags(sortObj); // 将排序的tags传给子组件 触发更新
    } else {
      message.warn('当前列的数据全部为空，排序失败！');
    }
  };

  const fnSetSearchTags = (field, columnTitle, list) => {
    const defSearchTags = cloneDeep(searchTags);
    let newTagObj;
    const flagIndex = defSearchTags.findIndex(itm => itm.key === field);
    if (flagIndex > -1) {
      // 如果筛选项里没有当前数据
      if (Array.isArray(defSearchTags[flagIndex].value)) {
        // 如果搜索的value是数组，那么就进行合并去重
        defSearchTags[flagIndex].value = [...list];
      }
    } else {
      // 如果筛选项里没有当前数据，则插入新的一条筛选项
      newTagObj = {
        title: columnTitle,
        key: field,
        value: list,
      };
      defSearchTags.push(newTagObj);
    }
    setSearchTags([...defSearchTags]);
  };
  // 设置搜索标签的值
  // const fnSetSearchTags = (field, columnTitle, list) => {
  //   const defSearchTags = cloneDeep(searchTags);
  //   let newTagObj;
  //   const flagIndex = defSearchTags.findIndex(itm => itm.key === field);
  //   if (flagIndex > -1) {
  //     // 如果筛选项里没有当前数据
  //     if (Array.isArray(defSearchTags[flagIndex].value)) {
  //       // 如果搜索的value是数组，那么就进行合并去重
  //       defSearchTags[flagIndex].value = [...list];
  //     }
  //   } else {
  //     // 如果筛选项里没有当前数据，则插入新的一条筛选项
  //     newTagObj = {
  //       title: columnTitle,
  //       key: field,
  //       value: list,
  //     };
  //     defSearchTags.push(newTagObj);
  //   }
  //   setSearchTags([...defSearchTags]);
  //   // setIndeterminate(!!list.length && list.length < checkListOptionsSC.length);
  //   // setCheckAllSC(list.length === checkListOptionsSC.length);
  // };

  // 筛选里面的select 选择全部
  const onCheckAllSearchColumn = (e, checkList, dataIndex) => {
    setCheckListSC(e.target.checked ? [...checkList] : []);
    message.success(e.target.checked ? '全选' : '取消全选');
    setIndeterminate(false);
    setCheckAllSC(e.target.checked);
    const columnTitle = columns.find(itm => itm.dataIndex === dataIndex).title; // 取到当前列名
    fnSetSearchTags(dataIndex, columnTitle, e.target.checked ? checkList : []);
  };

  // 筛选框里面的搜索输入
  const handleKeySearch = (e, field) => {
    const columnTitle = columns.find(itm => itm.dataIndex === field).title; // 取到当前列名
    fnSetSearchTags(field, columnTitle, [e.target.value]);
  };

  // 防抖
  const debounce = (fn, wait) => {
    let timeout = null;
    return function (input) {
      input.persist();
      if (timeout !== null) clearTimeout(timeout);
      timeout = setTimeout(fn, wait, input);
    };
  };

  const CheckboxGroupRef = useRef(null);

  // 筛选里面的select 选择
  const onCheckSearchColumn = list => {
    // columnTitle 当前列名
    list = clearEmptyStrForArr(list); // 清除数组里面空项
    setCheckListSC(list);
    const { field, title: columnTitle } = CheckboxGroupRef.current.props; // 获取ref里面的field属性
    fnSetSearchTags(field, columnTitle, list);
  };

  // 表头自定义筛选
  const getColumnSearchProps = col => {
    const { dataIndex, type } = col;
    let isFixed;
    const fixedFlag = columns.find(item => item.dataIndex === dataIndex);
    if (fixedFlag) {
      isFixed = fixedFlag.fixed;
    }
    const _row = columns.find(itm => itm.dataIndex === dataIndex);
    let headerSearch;
    let searchInput;
    if (_row) {
      ({ headerSearch, searchInput = true } = _row);
    } else {
      headerSearch = {};
    }
    return {
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
        <div style={{ padding: 6, width: '260px', maxHeight: '500px', overflowY: 'scroll' }}>
          <div className="column-search">
            <div className="column-search-sort">
              <div
                className="h-ic"
                onClick={() => {
                  sortColumn('A-Z', dataIndex);
                }}
                style={
                  sortColumnInfo[dataIndex] && sortColumnInfo[dataIndex] === 'A-Z'
                    ? { color: '#1890FF' }
                    : {}
                }
              >
                <SortDescendingOutlined />
                升序
              </div>
              <div
                className="h-ic"
                onClick={() => {
                  sortColumn('Z-A', dataIndex);
                }}
                style={
                  sortColumnInfo[dataIndex] && sortColumnInfo[dataIndex] === 'Z-A'
                    ? { color: '#1890FF' }
                    : {}
                }
              >
                <SortAscendingOutlined />
                降序
              </div>
            </div>
            <div className="h-ic lock">
              {isFixed ? (
                <span className="cancel-lock" onClick={() => blockColumn(dataIndex, 0)}>
                  <Space>
                    <UnlockOutlined />
                    取消锁定
                  </Space>
                </span>
              ) : (
                <span className="locking" onClick={() => blockColumn(dataIndex, 1)}>
                  <Space>
                    <LockOutlined />
                    锁定此列
                  </Space>
                </span>
              )}
            </div>
            {searchInput ? (
              <div className="h-ic filter" style={{ marginBottom: '15px' }}>
                <FilterOutlined /> 筛选
                <Input
                  placeholder="字段搜索"
                  onChange={debounce(e => {
                    handleKeySearch(e, dataIndex);
                  }, 1000)}
                  style={{ margin: '12px 0' }}
                  suffix={<SearchOutlined />}
                />
                {headerSearch ? (
                  <div className="select-props-list">
                    <Checkbox
                      ref={CheckboxGroupRef}
                      title={_row.title}
                      field={dataIndex} // 当前checkbox绑定的字段
                      indeterminate={indeterminate}
                      onChange={e => onCheckAllSearchColumn(e, headerSearch, dataIndex)}
                      checked={checkAllSC}
                    >
                      Check all
                    </Checkbox>
                    <CheckboxGroup
                      options={headerSearch}
                      value={checkListSearchColumn}
                      onChange={onCheckSearchColumn}
                    />
                  </div>
                ) : (
                  ''
                )}
              </div>
            ) : (
              ''
            )}
            <div className="column-search-button">
              <Space>
                <Button
                  shape="round"
                  size={13}
                  onClick={() => {
                    clearFilterForField(dataIndex);
                    confirm();
                  }}
                >
                  取消
                </Button>
                <Button
                  type="primary"
                  shape="round"
                  size={13}
                  onClick={() => {
                    confirm();
                  }}
                >
                  确定
                </Button>
              </Space>
            </div>
          </div>
        </div>
      ),
      filterIcon: filtered => <DownCircleOutlined style={{ fontSize: '18px' }} />,
      onFilter: (value, record) =>
        record[dataIndex]
          ? record[dataIndex].toString().toLowerCase().includes(value.toLowerCase())
          : '',
      onFilterDropdownVisibleChange: visible => {
        if (visible) {
          // 打开下拉
        }
      },
      render: text => {
        if (dataIndex.indexOf('time') > -1 || dataIndex.indexOf('date') > -1) {
          text = moment(text).format('YYYY-MM-DD HH:mm:ss');
        }
        // if (isNumber(text)) {
        //   text = parseInt(text, 10); // 取整
        // }
        if (type === 'percent' && text) {
          // 百分比类型，数据后自动加百分号
          text = `${text * 100}%`;
        } else if ((!type || type === 'number') && isNumber(text)) {
          text = parseInt(text, 10); // 取整
        }
        if (searchedColumn === dataIndex) {
          return (
            <Highlighter searchWords={searchText} textToHighlight={text ? text.toString() : ''} />
          );
        } else {
          return (
            <Tooltip placement="top" title={text}>
              {text}
            </Tooltip>
          );
        }
      },
    };
  };

  // 刷新表格
  const refreshTable = () => {
    const { refreshTable } = props;
    if (refreshTable) refreshTable();
  };

  const handleSearch = (selectedKeys, confirm, dataIndex) => {
    confirm();
    setSearchText(selectedKeys[0]);
    setSearchedColumn(dataIndex);
  };

  const handleReset = clearFilters => {
    clearFilters();
    setSearchText('');
  };

  // 最终渲染的columns
  const columnsRender = columns.map((col, index) => {
    const obj = {
      ...col,
      ellipsis: {
        // 一行显示
        showTitle: false,
      },
      ...getColumnSearchProps(col),
      onHeaderCell: column => ({
        width: column.width,
        onResize: handleResize(index),
      }),
    };

    // 递归判断children
    // let obj1;
    // const recursiveChild = (curData) => {
    //   if (curData.children) {
    //     recursiveChild(curData.children)
    //   } else {
    //     if (curData.editable) {
    //       obj1 = {
    //         ...curData,
    //         ...getColumnSearchProps(curData.dataIndex),
    //         onHeaderCell: column => ({
    //           width: column.width,
    //           onResize: handleResize(index),
    //         }),
    //       };
    //       return {
    //         ...obj,
    //         onCell: (record, index) => ({
    //           record,
    //           editable: col.editable,
    //           dataIndex: col.dataIndex,
    //           title: col.title,
    //           handleSave: () => handleSaveCell(record, index),
    //         }),
    //       };
    //     }
    //   }
    // }
    // recursiveChild(col);

    // 如果包含二级表头支持行内编辑
    let colDef = cloneDeep(col);
    if (colDef.children) {
      colDef = cloneDeep(col);
      colDef.children.forEach((itm, inx) => {
        const childrenObj = {
          ...itm,
          ...getColumnSearchProps(itm),
          onHeaderCell: column => ({
            width: column.width,
            onResize: handleResize(inx),
          }),
        };
        // if (itm.editable) {
        //   colDef.children[inx] = {
        //     ...childrenObj,
        //     onCell: record => ({
        //       record,
        //       editable: itm.editable,
        //       dataIndex: itm.dataIndex,
        //       title: itm.title,
        //       handleSave: () => handleSaveCell(record), // 返回 dataIndex, 给父组件是哪一列更新了
        //     }),
        //   };
        colDef.children[inx] = {
          ...childrenObj,
          onCell: record => ({
            record,
            editable: itm.editable,
            dataIndex: itm.dataIndex,
            title: itm.title,
            type: itm.type, // 数据类型
            handleSave: () => handleSaveCell(record), // 返回 dataIndex, 给父组件是哪一列更新了
          }),
        };
      });
      return colDef;
    }

    if (col.editable) {
      return {
        ...obj,
        onCell: record => ({
          record,
          editable: col.editable,
          dataIndex: col.dataIndex,
          title: col.title,
          type: col.type, // 数据类型
          handleSave: () => handleSaveCell(record),
        }),
      };
    }
    return obj;
  });

  // 表格组件
  const components = {
    header: {
      cell: ResizableTitle,
    },
    body: {
      row: EditableRow,
      cell: EditableCell,
    },
  };

  // 表格求和
  const tableSummary = pageData => {
    const newPageData = [];
    if (pageData.length > 0) {
      pageData.forEach(itm => {
        const obj = {};
        Object.keys(itm).forEach(kys => {
          const findFlag = deepFind(columns, kys, 'dataIndex');
          if (findFlag) {
            obj[kys] = itm[kys];
          }
        });
        newPageData.push(obj);
      });
      // 不处理的常用日期字段
      const filterField = ['insert_time', 'create_time', 'update_time', 'report_date'];
      const totalArr = new Array(Object.keys(newPageData[0]).length).fill(0);
      newPageData.forEach(item => {
        Object.keys(item).forEach((key, index) => {
          // 处理pageData数据，由于pageData数据为接口传递过来的原始数据，可能和表头展示的数据长度不对应
          const newColumns = columnsExportChild(columns);
          const isShow = newColumns.findIndex(colu => colu.dataIndex === key);
          const _obj = newColumns.find(colu => colu.dataIndex === key);
          if (isShow > -1 && _obj.type === 'number') {
            const _val = item[key] ? parseFloat(item[key]) : 0;
            if (filterField.indexOf(key) < 0) {
              totalArr[isShow] += _val;
              if (isNaN(totalArr[isShow])) {
                totalArr[isShow] = 0;
              }
            }
          } else {
            totalArr[isShow] = '';
          }
        });
      });
      return (
        <>
          <Table.Summary.Row>
            <Table.Summary.Cell>
              <Text type="danger">总计：</Text>
            </Table.Summary.Cell>
            {totalArr.map((arr, index) => (
              <Table.Summary.Cell key={`${arr}${index}`}>
                <Text type="danger">
                  <strong>{~~arr}</strong>
                </Text>
              </Table.Summary.Cell>
            ))}
          </Table.Summary.Row>
        </>
      );
    }
  };

  useImperativeHandle(props.cRef, () => ({
    // 将组件的方法通过ref方式暴露出去
    addRow() {
      handleAddRow();
    },
  }));

  return (
    <div>
      <Spin spinning={spinFlg} tip="加载中~">
        <div style={{ display: selectedRows.length === 0 ? '' : 'none' }}>
          <TopSearch
            searchTags={searchTags}
            refrenshTable={props.refrenshTable}
            exportDatas={selectedRows}
            addRow={handleAddRow}
            deleteSearchTags={deleteSearchTags}
            refreshTable={refreshTable}
            exportDataAll={() => {
              props.exportDataAll();
            }}
            dynSolt={props.headerRigSolt}
          />
        </div>
        <div style={{ display: selectedRows.length > 0 ? '' : 'none' }}>
          <TopOperations
            handleDelete={handleDelete}
            selectedRows={selectedRows}
            exportColumns={columns}
            addRow={handleAddRow}
            copyAdd={props.options ? props.options.copyAdd : false}
            slot={props.operationsSlot} // 操作栏插槽 类型Array
          />
        </div>
        <Table
          sticky
          bordered
          components={components}
          columns={columnsRender}
          dataSource={dataSource}
          rowClassName={() => 'editable-row'}
          onChange={props.handleTableChange}
          rowKey="id"
          pagination={pagination}
          size="small"
          scroll={{ y: innerHeight - 200 }}
          rowSelection={{ ...rowSelection }}
          summary={tableSummary}
        />
      </Spin>
    </div>
  );
};

export default MyTable;
