
$(function () {
  $("#titleHeader").html("");
  var url = window.location.href;
  var arr = url.split("/");

  var first = true;

  const path = arr[0] + "//" + arr[2]  + "/" + arr[3] + "/api"

  const ui = SwaggerUIBundle({
    url: path + "/v3/api-docs",
    dom_id: '#swagger-ui',
    deepLinking: true,
    responseInterceptor: function (response) {
      if (first) {
        var tmp = JSON.parse(response.text);
        tmp.servers = [{ url: path }];
        tmp.basePath = '/' + window.location.pathname.split("/")[1] + '/api/';
        response.text = JSON.stringify(tmp);
      }
      first = false;
      return response;
    },
    requestInterceptor: function (req) {
      req.headers["Authorization"] = 'Bearer ' + keycloak.token;
      return req;
    },
    presets: [
      SwaggerUIBundle.presets.apis,
      SwaggerUIStandalonePreset
    ],
    plugins: [
      SwaggerUIBundle.plugins.DownloadUrl
    ],
    layout: "StandaloneLayout"
  })
  // End Swagger UI call region
  window.ui = ui;
  });