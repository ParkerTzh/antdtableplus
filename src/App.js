import React, { useState, useEffect } from 'react';
import MyTable from "./components/TableGroup";
import _ from 'lodash'
import {message} from "antd";
import {MyTableContext} from "./components/TableGroup/Context/MyTableContext";
import TableUtils from "./utils/TableUtil";

const columnsJSON = require('./mock/columns.json');
const dataSource = require('./mock/data.json');
function App() {
    const [totalNum, setTotalNum] = useState(0);
    const [pages, setPage] = useState(1);
    const [columns, setColumns] = useState([]);
    const [pageSizes, setPageSize] = useState(20);
    const [searchValue, setSearchValue] = useState({});

    const headerSelectMapping = [
            {
                // 产品
                dataIndex: 'product',
                value: ['Giant', 'ZGL', 'Liv'],
            }
        ]

    /**
     * 表头下拉筛选
     */
    const initHeaderSelect = () => {
        setColumns(TableUtils.selSetColumns(headerSelectMapping, _.cloneDeep(columnsJSON)));
    }

    /**
     * 初始化表格数据
     */
    const initBaseData = () => {
        // do somethings
    }

    /**
     * 搜索
     * @param params
     * @returns {Promise<void>}
     */
    const handleSearch = async params => {
        let defSearchValue = _.cloneDeep(searchValue);
        if (JSON.stringify(params) === '{}') {
            defSearchValue = {};
        } else {
            Object.keys(params).forEach(key => {
                if (params[key].indexOf(',') > -1) {
                    params[key] = params[key].split(',');
                }
                defSearchValue[key] = params[key];
            });
        }
        setSearchValue({ ...defSearchValue });
    }

    /**
     *
     * @param row 行数据
     * @param type 操作类型 update：更新 add: 新增
     * @param currentDataIndex 当前dataIndex
     * @param editBeforeRecord 编辑前的数据
     * @returns {Promise<void>}
     */
    const handleSaveCell = async (row, type, currentDataIndex, editBeforeRecord) => {
        if (type === 'update') {
            // do somethings
            message.success("更新数据！");
        }  else if (type === 'add') {
            // do somethings
            message.success("新增数据！");
        }
    }

    /**
     * 删除行
     * @param id
     * @returns {Promise<void>}
     */
    const handleDelete = async id => {
        // api do somethings
        message.success('删除行数据！');
    }

    /**
     * 翻页
     * @param pagination
     */
    const handleTableChange = (pagination) => {
        setPage(pagination.current);
        setPageSize(pagination.pageSize);
        setSearchValue({
            ...searchValue,
            page: pagination.current,
            pageSize: pagination.pageSize,
        });
    }

    useEffect(() => {
       initHeaderSelect();
    }, []);

  return (
    <div className="App">
        <MyTableContext.Provider
            value={{
                operation: {
                    buttons: ['delete'],
                },
            }}>
            <MyTable
                columns={columns}
                dataSource={dataSource}
                pagination={{
                    total: totalNum,
                    showQuickJumper: true,
                    showSizeChanger: true,
                    defaultPageSize: 10,
                    defaultCurrent: 1,
                    current: pages,
                    pageSize: pageSizes,
                }}
                options={{
                    topSearch: true, // 顶部导航
                    copyAdd: true, // 复制新增
                }}
                refreshTable={initBaseData} // 刷新表格数据
                handleTableChange={handleTableChange} // 翻页
                handleSearch={handleSearch} // 搜索
                handleSaveCell={handleSaveCell} // 保存行数据 返回三个参数 row: 当前行数据， update: 当前操作, dataIndex: 当前列
                handleDelete={handleDelete} // 删除行
            />
        </MyTableContext.Provider>
    </div>
  );
}

export default App;
