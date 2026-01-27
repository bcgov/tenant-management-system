import { check } from "k6";
import http from "k6/http";
import { Rate } from "k6/metrics";

export let errorRate = new Rate("errors");

export const options = {
  thresholds: {
    checks: ["rate>0.99"], // 99% of checks must pass
    http_req_failed: ["rate<0.01"], // Less than 1% HTTP errors
  },
};

function checkStatus(response, checkName, statusCode = 200) {
  let success = check(response, {
    [checkName]: (r) => {
      if (r.status === statusCode) {
        return true;
      } else {
        console.error(
          checkName + " failed. Incorrect response code." + r.status,
        );
        return false;
      }
    },
  });
  errorRate.add(!success, { tag1: checkName });
}

export default function () {
  let url = `${__ENV.BACKEND_URL}/v1/health`;
  let params = {
    headers: {
      "Content-Type": "application/json",
    },
  };
  let res = http.get(url, params);
  checkStatus(res, "get-health", 200);
}
