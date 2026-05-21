/** 把上游网关的错误响应转成对用户友好的中文提示。对齐 python 版行为。 */
export async function normalizeUpstreamError(
  resp: Response,
  baseUrl: string,
): Promise<string> {
  let body = "";
  try {
    body = await resp.text();
  } catch {
    body = "";
  }
  let msg = body;
  try {
    const j = JSON.parse(body);
    msg = j?.error?.message ?? j?.message ?? body;
  } catch {}

  const code = resp.status;
  const low = (msg || "").toLowerCase();
  const hints: string[] = [];

  if (code === 401) {
    hints.push("API Key 无效或过期。PackyAPI 需使用 **sora 分组** 的令牌。");
  } else if (code === 403) {
    hints.push("权限不足。令牌分组必须是 **sora**。");
  } else if (code === 402) {
    hints.push("账户余额不足，请到网关控制台充值。");
  } else if (code === 429) {
    hints.push("触发频率限制，等几秒再试。");
  } else if ([520, 522, 524].includes(code)) {
    hints.push(
      "Cloudflare 超时：模型生成耗时过长。建议把质量降到 low、尺寸 1024×1024、数量 1。",
    );
  } else if ([502, 503, 504].includes(code)) {
    hints.push("上游服务抖动，稍后重试。");
  } else if (code === 400) {
    if (low.includes("size"))
      hints.push(
        "尺寸不合规：最长边 ≤3840，宽高为 16 的倍数，宽高比 ≤3:1，总像素 655,360 ~ 8,294,400。",
      );
    if (low.includes("model"))
      hints.push("模型名错误，建议使用 `gpt-image-2`。");
    if (low.includes("multipart") && low.includes("eof"))
      hints.push("上传被网关截断：换更小的图，或把质量调低再试。");
  }

  const host = safeHost(baseUrl);
  const tail = hints.length ? `\n\n💡 ${hints.join(" ")}` : "";
  return `HTTP ${code} @ ${host}: ${truncate(msg || resp.statusText, 240)}${tail}`;
}

function truncate(s: string, n: number) {
  return s && s.length > n ? s.slice(0, n) + "…" : s;
}
function safeHost(u: string) {
  try {
    return new URL(u).host;
  } catch {
    return u;
  }
}
