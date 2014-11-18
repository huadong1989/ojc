var fs = require('fs');
var rpath = require('path');
var crypto = require('crypto');
var CleanCSS = require('clean-css');
var jsp = require("./uglifyJs/uglify-js").parser;
var pro = require("./uglifyJs/uglify-js").uglify;


/**
* 压缩需要配置的部分
*/
var basePath = "./src/main/webapp";//需要扫描文件的目录
var suffix = ['jsp','html'];//需要扫描文件的类型


var fileList = [];//存放扫描后的文件
var mapJsonFileName = "./map.json";//保存压缩后文件的md5值


/**
* 扩展方法
*/
Array.prototype.indexOf=function(value){
	for(var i=0,l=this.length;i<l;i++){
		if(this[i]==value){
			return i;
		}
	}
	return -1;
}

/**
* mapJson 
* {filepath:{md5:}}
*/
var mapJson = (function(){
	var mapInfo = fs.readFileSync(mapJsonFileName, 'utf8');
	if(mapInfo){
		return JSON.parse(mapInfo);
	}
	return {};
})();

/**
* 生成MD5
*/
var md5 = function(data, len){
    var md5sum = crypto.createHash('md5'),
        encoding = typeof data === 'string' ? 'utf8' : 'binary';
    md5sum.update(data, encoding);
    len = len || 7;
    return md5sum.digest('hex').substring(0, len);
};

// 创建所有目录
var mkdirs = function(dirpath) {
    var dirArr = dirpath.split("/");
    var tpath = "";
    for(var i=0;i<dirArr.length;i++){
        tpath = tpath + dirArr[i] + "/";
        if(!fs.existsSync(tpath)){
            fs.mkdirSync(tpath);
        }
    }
};

/**
* ugilfy js压缩
*/
var minifier = function(flieIn, fileOut,type) {
     var flieIn=Array.isArray(flieIn)? flieIn : [flieIn];
     var origCode,ast,finalCode='';
     for(var i=0; i<flieIn.length; i++) {
     		origCode = fs.readFileSync(flieIn[i], 'utf8');
	     	if(type == "js"){
		        ast = jsp.parse(origCode);
		        ast = pro.ast_mangle(ast);
		        ast= pro.ast_squeeze(ast); 
		        finalCode +=';'+ pro.gen_code(ast);
	     	}else if(type == "css"){
	     		var cssMinify = new CleanCSS({advanced:true});
	     		//origCode = origCode.replace(/\r/ig,"").replace(/\n/ig,"");
	     		var min = cssMinify.minify(origCode);
	     		finalCode += '\n' + cssMinify.minify(min);
	     	}
     }
     var mFileMap = mapJson[fileOut];
     var contentMd5 = md5(finalCode,32);
     if(typeof mFileMap != 'undefined'){
     	  if(mFileMap.md5 && mFileMap.md5 == contentMd5){
     	  		return ;
     	  }
     }
     mapJson[fileOut] = {md5:contentMd5};
     if(!fs.existsSync(rpath.dirname(fileOut))){
     	mkdirs(rpath.dirname(fileOut));
     }
     fs.writeFileSync(fileOut, finalCode, 'utf8');
}

/**
* 循环读取目录
*/
var getFileList = function(spath){
  var dirList = fs.readdirSync(spath);
 
  dirList.forEach(function(item){
    if(fs.statSync(spath + '/' + item).isFile()){
	  if(suffix.indexOf(rpath.extname(item).substring(1))!=-1){
		fileList.push(spath + '/' + item);
	  }
    }
  });
 
  dirList.forEach(function(item){
    if(fs.statSync(spath + '/' + item).isDirectory()){
      getFileList(spath + '/' + item);
    }
  });
}

/**
* 异步写文件
*/
var writeFileFn = function(file,data){
	fs.exists(file,function(exists){
		fs.writeFile(file, data, function (err) {
			if (err) throw err;
		});
	});
};

/**
* 读取文件
*/
var optimize = function(file){
    console.log("optimize start scan "+file);

	var data = fs.readFileSync(file, 'utf8');
    	data = data.replace(/\r/ig,"").replace(/\n/ig,"");

    //获取target section
	var pattern = /<!-- target="([A-Za-z0-9-\/]+\.[js|css]+)" {{{ -->([^}]+)<!-- }}} -->/gm;
     
    //查看是否包含target section
	var res = data.match(pattern);
	if(res){

		//搜集section 对应的 min 和 scripts
		var carr = [];

		for(var i=0;i<res.length;i++){

			var section = res[i];
			var pattern1 = /<!-- target="([A-Za-z0-9-\/]+\.[js|css]+)" {{{ -->([^}]+)<!-- }}} -->/gm;

			var res1 = section.match(pattern1);
			var newFileName = RegExp.$1;
			var scripts = RegExp.$2;

			var extname = rpath.extname(newFileName).substring(1);
			var pattern2;
			if(extname == "js"){
				pattern2  = /<script src="([A-Za-z0-9-\/\._]+\.js)"><\/script>/gm;
			}else if(extname == "css"){
				pattern2  = /<link href="([A-Za-z0-9-\/\._]+\.css)" rel="stylesheet" type="text\/css"\/>/gm;
			}

			var res2 = scripts.match(pattern2);
			var fistStr = newFileName.substring(0,1);
			if(newFileName.length>1&&fistStr!="/"){
				newFileName = "/"+newFileName;
			}
			var cons = {minFileName:basePath+newFileName,type:extname};
			var files = [];
			if(res2){
				res2.forEach(function(item){
					var res3 = item.match(pattern2);
					var sfileName = RegExp.$1;
					var sfistStr = sfileName.substring(0,1);
					if(sfileName.length>1&&sfistStr!="/"){
						sfileName = "/"+sfileName;
					}
					files.push(basePath+sfileName);
				});
			}
			cons.files = files;
			carr.push(cons);
		}

		//压缩合并文件
		carr.forEach(function(item){
			minifier(item.files,item.minFileName,item.type);
		});

		//生成new map.json
		var mapJsonInfo = JSON.stringify(mapJson);
		fs.writeFileSync(mapJsonFileName, mapJsonInfo, 'utf8');

		//console.log(file+"开始替换文件");
		var patternJs = /<!-- target="([A-Za-z0-9-\/]+\.js)" {{{ -->([^}]+)<!-- }}} -->/gm;
		data = data.replace(patternJs,"<script src='$1'></script>");

		var patternCss = /<!-- target="([A-Za-z0-9-\/]+\.css)" {{{ -->([^}]+)<!-- }}} -->/gm;
		data = data.replace(patternCss,'<link href="$1" rel="stylesheet" type="text/css">');

		//查看压缩文件是否更新
		for(var key in mapJson){
			var obj = mapJson[key],spath = key.replace(basePath,'');
			if(obj){
				data = data.replace(spath,spath+"?v="+obj.md5.substring(0,7));
			}
		}

		//写入文件
		writeFileFn(file,data);
	};
	console.log("optimize end scan "+file);
};

var init = function(){
    var nowTime = (new Date()).getTime();

	getFileList(basePath);

	fileList.forEach(function(item){
		optimize(item);
	});
	var endTime = (new Date()).getTime();
	console.log("all time "+Math.ceil((endTime-nowTime)/1000)+"s");
};

/**
*控制命令行参数
*/
var arguments = process.argv.splice(2);
if(arguments.length>0){
	var args = arguments;
	if(args.length>0 && args[0]=="-o"){
		init();
	}
}