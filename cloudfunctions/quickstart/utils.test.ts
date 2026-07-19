/**
 * 工具函数单元测试
 * 
 * 测试公共工具模块的正确性
 */

import {
  formatDate,
  formatDateTime,
  validateString,
  validateNumber,
  validateEnum,
  generateBatchNo
} from './utils';

// ==================== 测试辅助函数 ====================

let passCount = 0;
let failCount = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`✅ ${message}`);
    passCount++;
  } else {
    console.error(`❌ ${message}`);
    failCount++;
  }
}

function assertThrows(fn: () => void, expectedMessage: string, testName: string) {
  try {
    fn();
    console.error(`❌ ${testName}: 应该抛出异常但没有`);
    failCount++;
  } catch (error: any) {
    if (error.message.includes(expectedMessage)) {
      console.log(`✅ ${testName}: 正确抛出异常`);
      passCount++;
    } else {
      console.error(`❌ ${testName}: 抛出异常但消息不匹配，期望: "${expectedMessage}", 实际: "${error.message}"`);
      failCount++;
    }
  }
}

// ==================== 测试用例 ====================

console.log('\n🧪 开始运行工具函数测试...\n');

// 测试 1: formatDate
console.log('📅 测试 formatDate 函数:');
const testDate = new Date(2026, 6, 19, 14, 30, 45);
const formatted = formatDate(testDate);
assert(formatted === '2026-07-19 14:30:45', `格式化日期: ${formatted}`);

// 测试 2: formatDateTime - 字符串格式
console.log('\n📅 测试 formatDateTime 函数:');
const dateStr1 = formatDateTime('2026-07-19 14:30:45');
assert(dateStr1 === '2026-07-19 14:30:45', `标准格式: ${dateStr1}`);

const dateStr2 = formatDateTime('2026/07/19 14:30:45');
assert(dateStr2 === '2026-07-19 14:30:45', `斜杠格式转换: ${dateStr2}`);

const dateStr3 = formatDateTime('2026-07-19T14:30:45');
assert(dateStr3 === '2026-07-19 14:30:45', `ISO格式转换: ${dateStr3}`);

const dateStr4 = formatDateTime('invalid-date');
assert(dateStr4 === null, `无效日期返回null: ${dateStr4}`);

const dateStr5 = formatDateTime(null);
assert(dateStr5 === null, `null值返回null: ${dateStr5}`);

// 测试 3: formatDateTime - Excel 序列号
const excelDate = formatDateTime(45123); // Excel 日期序列号
assert(excelDate !== null && typeof excelDate === 'string', `Excel序列号转换: ${excelDate}`);

// 测试 4: validateString
console.log('\n🔤 测试 validateString 函数:');
const str1 = validateString('  hello world  ', 'test_field');
assert(str1 === 'hello world', `去除空格: "${str1}"`);

assertThrows(
  () => validateString('', 'test_field'),
  '不能为空',
  '空字符串必填验证'
);

assertThrows(
  () => validateString(null, 'test_field'),
  '不能为空',
  'null值必填验证'
);

const str2 = validateString('', 'test_field', false);
assert(str2 === '', `非必填空字符串: "${str2}"`);

// 测试 5: validateNumber
console.log('\n🔢 测试 validateNumber 函数:');
const num1 = validateNumber('123.456', 'amount');
assert(num1 === 123.46, `数字格式化: ${num1}`);

const num2 = validateNumber(99.9, 'amount');
assert(num2 === 99.9, `数字类型输入: ${num2}`);

assertThrows(
  () => validateNumber('abc', 'amount'),
  '必须是有效数字',
  '无效数字验证'
);

assertThrows(
  () => validateNumber(-10, 'amount', true, 0),
  '不能小于0',
  '最小值验证'
);

const num3 = validateNumber('', 'amount', false);
assert(num3 === 0, `非必填空值: ${num3}`);

// 测试 6: validateEnum
console.log('\n📋 测试 validateEnum 函数:');
const enum1 = validateEnum('completed', 'status', ['completed', 'cancelled']);
assert(enum1 === 'completed', `有效枚举值: ${enum1}`);

const enum2 = validateEnum(undefined, 'status', ['completed', 'cancelled'], 'completed');
assert(enum2 === 'completed', `默认值: ${enum2}`);

assertThrows(
  () => validateEnum('invalid', 'status', ['completed', 'cancelled']),
  '必须是以下值之一',
  '无效枚举值验证'
);

// 测试 7: generateBatchNo
console.log('\n🆔 测试 generateBatchNo 函数:');
const batchNo1 = generateBatchNo();
const batchNo2 = generateBatchNo();
assert(batchNo1.startsWith('BATCH_'), `批次号格式: ${batchNo1}`);
assert(batchNo1 !== batchNo2, '每次生成不同的批次号');
assert(batchNo1.length > 10, `批次号长度合理: ${batchNo1.length}`);

// ==================== 测试结果汇总 ====================

console.log('\n' + '='.repeat(50));
console.log('📊 测试结果汇总:');
console.log('='.repeat(50));
console.log(`✅ 通过: ${passCount}`);
console.log(`❌ 失败: ${failCount}`);
console.log(`📈 通过率: ${((passCount / (passCount + failCount)) * 100).toFixed(2)}%`);
console.log('='.repeat(50) + '\n');

if (failCount > 0) {
  console.error('⚠️  存在失败的测试，请检查代码！\n');
  process.exit(1);
} else {
  console.log('🎉 所有测试通过！\n');
  process.exit(0);
}
