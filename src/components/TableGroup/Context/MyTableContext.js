import React from 'react';

/**
 * MyTable头部按钮配置文件，当前只配置了delete按钮显示
 * @type {React.Context<{operation: {buttons: [string]}}>}
 */

export const MyTableContextDefData = {
  operation: {
    // buttons: ['delete66'],
  },
};

// 导出 context 对象
export const MyTableContext = React.createContext(MyTableContextDefData);
