const TableUtils = {
  selSetColumns: (dataIndex, columnsJSON) => {
    console.log('执行sel')
    // 设置列
    let columnsDef = columnsJSON;
    if (Array.isArray(dataIndex)) {
      // 一次性设置多少columns
      const selMaping = [...dataIndex];
      columnsDef = columnsDef.map(col => {
        const flag = selMaping.find(itm => itm.dataIndex === col.dataIndex);
        if (flag) {
          const { value } = flag;
          // 默认要编辑必须在columns配置"editable": true
          if (col.editable) col.editable = ['select', value];
          col.headerSearch = value;
        }
        return col;
      });
    }
    return columnsDef;
  },
};

export default TableUtils;
