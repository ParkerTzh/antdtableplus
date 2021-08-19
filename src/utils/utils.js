import { parse } from 'querystring';
import pathRegexp from 'path-to-regexp';
import xlsx from 'xlsx';
import cnchar from 'cnchar';

const csv = require('csvtojson');

/* eslint no-useless-escape:0 import/prefer-default-export:0 */
const reg = /(((^https?:(?:\/\/)?)(?:[-;:&=\+\$,\w]+@)?[A-Za-z0-9.-]+(?::\d+)?|(?:www.|[-;:&=\+\$,\w]+@)[A-Za-z0-9.-]+)((?:\/[\+~%\/.\w-_]*)?\??(?:[-\+=&;%@.\w_]*)#?(?:[\w]*))?)$/;

export const isUrl = path => reg.test(path);

export const getPageQuery = () => parse(window.location.href.split('?')[1]);

/**
 * props.route.routes
 * @param router [{}]
 * @param pathname string
 */
export const getAuthorityFromRouter = (router, pathname) => {
    const authority = router.find(({ path }) => path && pathRegexp(path).exec(pathname));
    if (authority) return authority;
    return undefined;
};

export const getRouteAuthority = (routeData, path) => {
    let authorities;
    routeData.forEach(route => {
        // exact match
        if (route.routes) {
            authorities = getRouteAuthority(route.routes, path) || authorities;
        } else if (route.path && pathRegexp(route.path).test(path)) {
            authorities = route;
        }
    });
    return authorities;
};

/**
 * 获取授权的叶子菜单
 */
export const getAuthLeaf = (routeData, authList) => {
    const routerMap = [];
    const getLeafMenu = data => {
        data.forEach(menuItem => {
            if (!menuItem) {
                return;
            }
            // get only leaf node
            if (menuItem && menuItem.routes) {
                getLeafMenu(menuItem.routes);
            } else if (menuItem.path && !isUrl(menuItem.path) && !menuItem.redirect) {
                routerMap.push(menuItem);
            }
        });
    };
    getLeafMenu(routeData);
    const leafList = routerMap.filter(item => authList.includes(item.path));
    return leafList;
};

/**
 * 联动下拉数据获取
 * @param list
 * @param keyName
 * @param valueName
 * @returns {*}
 */
export const linkageData = (list, keyName, valueName) => {
    const res = list.reduce((pre, cur) => {
        if (cur[keyName] in pre) {
            if (cur[valueName] !== '' && pre[cur[keyName]].indexOf(cur[valueName]) === -1) {
                pre[cur[keyName]].push(cur[valueName]);
            }
            return pre;
        }

        pre[cur[keyName]] = [cur[valueName]];
        return pre;
    }, {});
    return res;
};

/**
 * 根据某个属性，求数组对象里某个属性值的和
 * @param data
 * @param kys
 * @param sumKys
 * @returns {{}}
 */
export const arrSumForKey = (data, kys, sumKys) => {
    const res = {};
    data.reduce((pre, cur) => {
        Object.keys(cur).forEach(key => {
            if (key === kys) {
                console.log(cur[sumKys]);
                const iK = cur[kys];
                if (res[iK]) {
                    res[iK] += Number(cur[sumKys]);
                } else {
                    res[iK] = Number(cur[sumKys]);
                }
            }
        });
        return cur;
    }, 0);
    return res;
};

/**
 * 数组对象去重：id、name，type都重复的时候，才会被去重
 * @param arr
 * @returns {unknown[]}
 */
// export const delRepeat = arr => {
//   return Object.values(
//     arr.reduce((obj, next) => {
//       const key = JSON.stringify(next);
//       return (obj[key] = next), obj;
//     }, {})
//   );
// }

/**
 * 获取冒号隔开的字符串
 * @param str
 * @returns {*}
 */
export const getColonStr = str => {
    let res;
    if (str.toString().indexOf(':') > 0) {
        res = str.split(':');
    }
    return res;
};

/**
 * 数组对象根据某个属性值 A-Z 或者Z-A排序 （支持数字）
 * 三方库：npm i convert2pinyin 获取首字母
 * @param data
 * @param key
 * @param type
 * @returns {[]}
 */
export const sortAZ = (data, key, type) => {
    let firstWords = [];
    const indexWords = [];
    let res = [];
    firstWords = data.reduce((pre, cur, index) => {
        Object.keys(cur).forEach(ik => {
            if (ik === key) {
                let fv;
                if (typeof cur[key] === 'string') {
                    fv = cur[key].substr(0, 1);
                    fv = cnchar.spell(fv); // 获取拼音
                }
                if (!fv) {
                    fv = cur[key];
                }
                pre.push(fv);
                indexWords.push({
                    str: fv,
                    inx: index,
                });
            }
        });
        return pre;
    }, []);
    firstWords = firstWords.sort();
    firstWords.reduce((pre, cur) => {
        if (cur !== pre) {
            const rs = indexWords.filter(item => item.str === cur);
            rs.forEach(itmc => {
                const { inx } = itmc;
                res.push(data[inx]);
            });
        }
        pre = cur;
        return pre;
    }, null);
    if (type === 'Z-A') {
        res = res.reverse();
    }
    return res;
};

/**
 * 判断是否为对象
 * @param val
 * @returns {boolean}
 */
export const isObj = val => Object.prototype.toString.call(val) === '[object Object]';

/**
 * 深度查找数组或对象里面children指定key值
 * @param data （原数据）
 * @param dataIndex （查找值）
 * @param key （查找键）
 * @param callBackKey （返回键，为空则返回整个查询对象）
 * @param callBackParent  是否返回整个父级对象
 * @returns {undefined|*}
 */
let deepFind_index;
export const deepFind = (data, dataIndex, key, callBackKey, callBackParent) => {
    if (Array.isArray(data)) {
        const findData = data.find(item => item[key] === dataIndex);
        if (findData) {
            return deepFind(findData, dataIndex, key, callBackKey);
        } else {
            for (let i = 0; i < data.length; i++) {
                deepFind_index = i;
                const res = deepFind(data[i], dataIndex, key, callBackKey);
                if (res) {
                    if (callBackParent) {
                        // 返回整个父级对象
                        return data[deepFind_index];
                    }
                    return res;
                }
            }
        }
    } else {
        if (data[key] === dataIndex) {
            return callBackKey ? data[callBackKey] : data;
        }
        // 深度查找
        const { children } = data;
        if (children) {
            return children[key] === dataIndex
                ? callBackKey
                    ? children[callBackKey]
                    : children
                : deepFind(children, dataIndex, key, callBackKey);
        }
    }
};

/**
 * 深度查找对象里是否存在某个属性
 * @param key
 * @param obj
 * @returns {boolean|undefined}
 */
export const deepFindKey = (key, data) => {
    if (isObj(data)) {
        if (data[key]) {
            return true;
        } else {
            for (const ky in data) {
                if (isObj(ky)) {
                    return deepFindKey(key, ky);
                }
            }
        }
    } else if (Array.isArray(data)) {
        for (const index of data) {
            const flag = deepFindKey(key, data[index]);
            if (flag) {
                return true;
            }
        }
    }
};

export const columnsExportChild = columns => {
    const res = [];
    for (const i of columns) {
        const _children = i.children;
        if (_children) {
            res.push(..._children);
        } else {
            res.push(i);
        }
    }
    return res;
};

/**
 * 清除数组空值项
 * @param arr
 */
export const clearEmptyStrForArr = arr => {
    // arr.forEach((i, inx) => {
    //   if (!i) {
    //     arr.splice(inx, 1);
    //   }
    // });
    // return arr;
    const res = arr.filter(s => s && s.trim());
    return res;
};

/**
 * 对比两个对象，取不同
 * 返回示例：{aa: (2) [12, 52]}
 * @param obj1
 * @param obj2
 * @returns {{}}
 */
export const comparisonObject = (obj1, obj2) => {
    const res = {};
    if (JSON.stringify(obj1) === JSON.stringify(obj2)) {
        return null;
    } else {
        Object.keys(obj1).forEach(key => {
            if (obj1[key] !== obj2[key]) {
                res[key] = [obj1[key], obj2[key]];
            }
        });
    }
    return res;
};

export const isNumber = val => {
    const regPos = /^\d+(\.\d+)?$/; //非负浮点数
    const regNeg = /^(-(([0-9]+\.[0-9]*[1-9][0-9]*)|([0-9]*[1-9][0-9]*\.[0-9]+)|([0-9]*[1-9][0-9]*)))$/; //负浮点数
    if (regPos.test(val) || regNeg.test(val)) {
        return true;
    } else {
        return false;
    }
};

/**
 * xlsHeaderMaps 导出表头键值对处理
 * @param data
 */
export const exportKeyMaps = data => {
    const res = {};
    if (data && Array.isArray(data)) {
        data.forEach(item => {
            res[item.dataIndex] = item.title;
        });
    }
    return res;
};

/**
 * 判断一个对象所有的值是否全部为0
 * @param data
 * @returns {boolean}
 * @constructor
 */
export const OBJECT_IS_ZERO = data => {
    let zeros = 0;
    let len = 0;
    Object.keys(data).forEach(key => {
        if (data[key] === 0) {
            zeros++;
        }
        len++;
    });
    if (zeros === len) {
        return true;
    }
    return false;
};

/**
 * 判断空对象
 * @param obj
 * @returns {boolean}
 */
export const isEmptyObject = obj => {
    if (typeof obj === 'object') {
        return JSON.stringify(obj) === '{}';
    } else {
        return true;
    }
};

/**
 *
 * @param file
 * @param options  dataType=table 返回antd表格格式的数据
 * @returns {Promise<unknown>}
 */
export const readXLSX_to_data = (file, options = {}) => {
    const { name } = file;
    const _tIndex = name.lastIndexOf('.');
    const fileType = name.substr(_tIndex + 1);
    const { dataType } = options;
    if (fileType === 'xlsx' || fileType === 'xls') {
        return new Promise(resolve => {
            const fileReader = new FileReader();
            fileReader.readAsArrayBuffer(file);
            fileReader.onload = event => {
                try {
                    const { result } = event.target;
                    const workbook = xlsx.read(result, { type: 'buffer' });
                    const data = {};
                    for (const sheet in workbook.Sheets) {
                        if (workbook.Sheets.hasOwnProperty(sheet)) {
                            const sheet2JSONOpts = {
                                defval: '', //给defval赋值为空的字符串
                                raw: false, // 不格式化数据 比如时间
                            };
                            const tempData = [];
                            if (workbook.Sheets.hasOwnProperty(sheet)) {
                                data[sheet] = tempData.concat(
                                    xlsx.utils.sheet_to_json(workbook.Sheets[sheet], sheet2JSONOpts),
                                );
                            }
                            const SheetList = Object.keys(data);
                            const [Sheet1] = SheetList;
                            const excelData = data[Sheet1];
                            if (dataType === 'table') {
                                const excelHeader = [];
                                // 获取表头
                                for (const headerAttr in excelData[0]) {
                                    if (excelData[0].hasOwnProperty(headerAttr)) {
                                        const header = {
                                            title: headerAttr,
                                            dataIndex: headerAttr,
                                            key: headerAttr,
                                        };
                                        excelHeader.push(header);
                                    }
                                }
                                resolve({
                                    tableData: excelData,
                                    tableHeader: excelHeader,
                                });
                            } else {
                                resolve(excelData);
                            }
                        }
                    }
                } catch (e) {
                    console.warn('解析失败', e);
                }
            };
        });
    } else if (fileType === 'csv') {
        return new Promise(resolve => {
            const fileReader = new FileReader();
            fileReader.readAsText(file, 'gbk');
            fileReader.onload = event => {
                const { result } = event.target;
                csv()
                    .fromString(result)
                    .then(obj => {
                        resolve(obj);
                    });
            };
        });
    } else {
        return false;
    }
};

/**
 * 递归清除对象(复杂各种嵌套都能搞定，嘎嘎的)
 * @param obj
 */
export const clearObj = obj => {
    const changeParams = {
        // 返回类型
        string: '',
        number: 0,
        boolean: null,
        undefined: '',
    };
    if (isObj(obj)) {
        Object.keys(obj).forEach(key => {
            if (isObj(obj[key]) || Array.isArray(obj[key])) {
                clearObj(obj[key]);
            } else {
                const tp = typeof obj[key];
                obj[key] = changeParams[tp];
            }
        });
    } else if (Array.isArray(obj)) {
        obj.reduce((pre, cur, i) => {
            if (isObj(cur) || Array.isArray(cur)) {
                clearObj(cur);
            } else {
                obj.splice(i, 1);
            }
            return pre;
        }, 0);
    }
    return obj;
};

export const AntInputDebounce = (fn, wait) => {
    let timeout = null;
    return function (input) {
        input.persist();
        if (timeout !== null) clearTimeout(timeout);
        timeout = setTimeout(fn, wait, input);
    };
};

/**
 * 数组切割
 * @param array
 * @param subGroupLength
 * @returns {[]}
 * @constructor
 */
export const ArrayGroup = (array, subGroupLength) => {
    let index = 0;
    const newArray = [];
    while (index < array.length) {
        newArray.push(array.slice(index, (index += subGroupLength)));
    }
    return newArray;
};

export const findKey = (data, value, compare = (a, b) => a === b) =>
    Object.keys(data).find(k => compare(data[k], value));
