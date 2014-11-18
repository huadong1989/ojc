ojc(基于Node 简易压缩javascript和css工具)
===

optimize javascript and css代码工具包

基于NodeJs环境的JS、CSS打包部署工具

1.jsp、html文件中编写格式
js例子：
<!-- target="/resources/release/js/index-min.js" {{{ -->
<script src="/resources/front/js/app/utils.js"></script>
<script src="/resources/front/js/app/common.js"></script>
<script src="/resources/front/js/app/index.js"></script>
<!-- }}} -->
上面例子的意思是把app下面的utils.js、common.js、index.js三个js文件压缩成release版本下的js目录下的index-min.js文件中。
特别注意的事项：
a) target标记需要按照规则来写
b) script标签不需要type属性，即只需要src属性
c) 不用target包含的script不会压缩和合并

css例子：
<!-- target="/resources/release/css/index-min.css" {{{ -->
<link href="/resources/front/css/index.css" rel="stylesheet" type="text/css"/>
<link href="/resources/front/css/loadingicons.css" rel="stylesheet" type="text/css"/>
<link href="/resources/front/js/plugin/tooltipster/css/tooltipster.css" rel="stylesheet" type="text/css"/>
<link href="/resources/front/js/plugin/tooltipster/css/themes/tooltipster-info.css" rel="stylesheet" type="text/css"/>
<!-- }}} -->
上面例子的意思是把css下面的index.css、loadingicons.css、tooltipster.css、tooltipster-info.css四个css文件压缩成release版本下的css目录下的index-min.css文件中。
规则和css规则相似。特别说明link标签只能包含href、rel、type属性。

2、压缩需要的环境
a) 需要安装node 版本v0.10.29以上的环境
b) 安装好node环境之后需要用npm（node package manager）包管理工具安装clean-css（css压缩工具）
   相关命令 npm install clean-css -gd
c) 需要把uglifyJs、build.js、map.json文件引入到你需要优化的项目根目录下

3、配置
打开build.js查看到下面的配置部分
/**
* 压缩需要配置的部分
*/
var basePath = "./src/main/webapp";//需要扫描文件的目录
var suffix = ['jsp','html'];//需要扫描文件的类型

a)basePath路径为需要扫描文件的根目录，注意此目录必须以当前build文件目录开始
b)suffix为需要扫描文件的类型，如jsp、html、htm等等

4、运行命令
windows 用DOS命令行、linux用shell命令行进入到项目的根目录下，运行node build.js -o命令即可实现压缩合并功能
export NODE_PATH=/usr/local/lib/node_modules/  
echo $NODE_PATH


