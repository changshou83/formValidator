type BhvValue = string | RegExp | number | boolean;
type BhvData = string | boolean;
type Level = 'common' | 'prior';
interface FormData {
  [propName: string]: BhvData;
}
interface FormRule {
  [propName: string]: BhvValue;
}
interface FormRuleMap {
  [propName: string]: FormRule;
}
interface Rule {
  name: string;
  level: Level;
  errorMsg: string;
  bhv: (value: BhvValue, data: BhvData) => boolean;
}

const Rules: Rule[] = [];

const addNewRules = (rule: Rule): void => {
  let exist = false,
    direct = 0;
  Rules.forEach((val, index) => {
    if (rule.name === val.name) {
      exist = true;
      direct = index;
    }
  });

  if (exist) Rules.splice(direct, 1);
  Rules.push(rule);
};
const whichLevel = (ruleName: string): string =>
  Rules.filter(rule => {
    if (rule.name === ruleName) return rule.level;
  })[0].level;
const verify = (
  ruleName: string,
  ruleValue: BhvValue,
  data: BhvData
): true | string => {
  const rule = Rules.filter(rule => {
    if (rule.name === ruleName) return rule;
  })[0];
  const validResult = rule.bhv(ruleValue, data);
  return validResult ? validResult : rule.errorMsg;
};
const sort = (rules: FormRule) => {
  const priorMap = {},
    commonMap = {};
  Object.keys(rules).forEach(ruleName => {
    if (whichLevel(ruleName) === 'prior') priorMap[ruleName] = rules[ruleName];
    if (whichLevel(ruleName) === 'common')
      commonMap[ruleName] = rules[ruleName];
  });
  return { priorMap, commonMap };
};

function formValidator(data: FormData, rulesMap: FormRuleMap) {
  let result = {};
  let errorMsg = {};
  let validResult;

  Object.keys(rulesMap).forEach(field => {
    const unVerifiedValue = data[field];
    const { priorMap, commonMap } = sort(rulesMap[field]);
    let priorPass = true,
      commonPass = true;

    Object.keys(priorMap).forEach(rule => {
      if (!priorPass) return;

      validResult = verify(rule, priorMap[rule], unVerifiedValue);
      if (typeof validResult === 'string') {
        priorPass = false;
        errorMsg[field] = { ...errorMsg[field], [rule]: validResult };
      }
    });
    if (!priorPass) return (result[field] = false);
    Object.keys(commonMap).forEach(rule => {
      if (!commonPass) return;

      validResult = verify(rule, commonMap[rule], unVerifiedValue);
      if (typeof validResult === 'string') {
        commonPass = false;
        errorMsg[field] = {
          ...errorMsg[field],
          [rule]: validResult,
        };
      }
    });
    result[field] = commonPass;
  });

  result = Object.keys(result).every(field => result[field] === true);
  return result ? result : errorMsg;
}

export { formValidator, addNewRules };
