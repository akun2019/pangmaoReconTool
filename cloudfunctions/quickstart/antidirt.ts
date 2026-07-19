/**
 * @param params 调用参数，HTTP 请求下为请求体
 * @param context 调用上下文
 *
 * @return 函数的返回数据，HTTP 场景下会作为 Response Body
 *
 */
import { dySDK } from "@open-dy/node-server-sdk";
export default async function (params: any, context: any) {
  const serviceContext = dySDK.context(context);
  const res = await serviceContext.openApiInvoke({
    // 替换为云调用内网专线域名
    url: "http://​developer-toutiao-com.openapi.dyc.ivolces.com/api/v2/tags/text/antidirt",
    method: "POST",
    data: params,
  });

  return res;
}
