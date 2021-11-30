const Rules = {
    prior: {},
    common: {
        maxLength: function (value, data) {
            if (data && data.length < value) return true
            else return false
        },
        reg: function (value, data) {
            return new RegExp(value).test(data)
        },
    },
    ErrorMsg: {
        maxLength: '长度超过指定值',
        reg: '验证失败',
    },
    selectRule: function (level, name) {
        return { bhv: this[level][name], errorMsg: this.ErrorMsg[name] }
    },
    addNewRule: function (level, name, errorMsg, bhv) {
        this[level][name] = bhv
        this.ErrorMsg[name] = errorMsg
    },
}
/**
 * 判断规则等级
 * @param {Object} rule 要询问优先级的规则
 * @returns 返回对应等级的字符串，若不是规则，返回isNotRule
 */
function whichLevel(rule) {
    if (Object.keys(Rules.common).includes(rule)) return 'common'
    else if (Object.keys(Rules.prior).includes(rule)) return 'prior'
    else return 'isNotRule'
}
/**
 * 添加新的规则
 * @param {Object} params 新规则的配置项
 */
function addNewRule({ level, name, errorMsg = '默认错误信息', bhv }) {
    if (typeof bhv !== 'function')
        throw new TypeError(`${name} is not a function`)
    Rules.addNewRule(level, name, errorMsg, bhv)
}
/**
 * 对指定值依照指定规则进行验证
 * @param {*} ruleName 制定规则名
 * @param {*} ruleValue 对应规则值
 * @param {*} data 要进行验证的数据
 * @returns 验证通过返回true，否则返回错误信息
 */
function verify(ruleName, ruleValue, data) {
    const rule = Rules.selectRule(whichLevel(ruleName), ruleName)
    const validResult = rule.bhv(ruleValue, data)
    return validResult ? validResult : rule.errorMsg
}
/**
 * 对规则进行优先级排序
 * @param {Object} rules 要进行排序的规则
 * @returns 排序后的规则对象
 */
function sort(rules) {
    let priorMap = {},
        commonMap = {}
    Object.keys(rules).forEach(rule => {
        if (whichLevel(rule) === 'common')
            commonMap = { ...commonMap, [rule]: rules[rule] }
        else if (whichLevel(rule) === 'prior')
            priorMap = { ...priorMap, [rule]: rules[rule] }
        else if (whichLevel(rule) === 'isNotRule')
            throw new Error(`不支持 ${rule} 规则`)
    })
    return { priorMap, commonMap }
}
/**
 * 主函数，对表单数据进行验证
 * @param {Object} data 要进行验证的数据
 * @param {Object} rulesMap 验证规则
 * @returns 若验证通过，返回true，否则返回错误信息
 */
function formValidator(data, rulesMap) {
    let result = {}
    let errorMsg = {}
    Object.keys(rulesMap).forEach(field => {
        const unVerifiedValue = data[field]
        let { priorMap, commonMap } = sort(rulesMap[field])
        let priorPass = true,
            commonPass = true

        Object.keys(priorMap).forEach(rule => {
            priorMap[rule] = verify(rule, priorMap[rule], unVerifiedValue)
            if (typeof priorMap[rule] === 'string') {
                priorPass = false
                errorMsg[field] = { ...errorMsg[field], [rule]: priorMap[rule] }
                return
            }
        })
        if (priorPass) {
            Object.keys(commonMap).forEach(rule => {
                commonMap[rule] = verify(rule, commonMap[rule], unVerifiedValue)
                if (typeof commonMap[rule] === 'string') {
                    commonPass = false
                    errorMsg[field] = {
                        ...errorMsg[field],
                        [rule]: commonMap[rule],
                    }
                    return
                }
            })
        } else {
            Object.keys(commonMap).forEach(rule => {
                commonMap[rule] = false
                errorMsg[field] = {
                    ...errorMsg[field],
                    [rule]: '高优先级规则错误',
                }
                commonPass = false
            })
        }
        result[field] = priorPass && commonPass
    })
    result = Object.keys(result).every(field => result[field] === true)
    return result ? result : errorMsg
}

export { formValidator, addNewRule }
