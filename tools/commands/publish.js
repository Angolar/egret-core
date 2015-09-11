/// <reference path="../lib/types.d.ts" />
var utils = require('../lib/utils');
var FileUtil = require('../lib/FileUtil');
var CopyFiles = require('../actions/CopyFiles');
var exml = require("../actions/exml");
var CompileProject = require('../actions/CompileProject');
var CompileTemplate = require('../actions/CompileTemplate');
var GenerateVersion = require('../actions/GenerateVersionCommand');
var ZipCMD = require("../actions/ZipCommand");
var ChangeEntranceCMD = require("../actions/ChangeEntranceCommand");
var Publish = (function () {
    function Publish() {
    }
    Publish.prototype.execute = function () {
        var options = egret.args;
        if (FileUtil.exists(options.srcDir) == false ||
            FileUtil.exists(options.templateDir) == false) {
            utils.exit(10015, options.projectDir);
        }
        options.minify = true;
        options.publish = true;
        utils.clean(options.releaseDir);
        exml.beforeBuild();
        var compileProject = new CompileProject();
        exml.build();
        var result = compileProject.compileProject(options);
        if (result.exitStatus)
            return result.exitStatus;
        utils.minify(options.out, options.out);
        CopyFiles.copyProjectFiles();
        exml.afterBuild();
        CompileTemplate.compileTemplates(options, result.files);
        //生成 all.manifest
        if (egret.args.properties.getPublishType(egret.args.runtime) == 1) {
            //生成 all.manifest 文件，并拷贝文件 删除旧文件
            (new GenerateVersion).execute();
        }
        if (egret.args.runtime == "native") {
            var versionFile = (egret.args.version || Math.round(Date.now() / 1000)).toString();
            //runtime  打包所有js文件以及all.manifest
            var zip = new ZipCMD(versionFile);
            zip.execute(function (code) {
                var releasePath = egret.args.releaseDir;
                var nativePath;
                if (nativePath = egret.args.properties.getNativePath("android")) {
                    var url1 = FileUtil.joinPath(nativePath, "proj.android");
                    var url2 = FileUtil.joinPath(nativePath, "proj.android/assets", "egret-game");
                    FileUtil.remove(url2);
                    FileUtil.createDirectory(url2);
                    FileUtil.copy(releasePath, url2);
                    //修改java文件
                    var entrance = new ChangeEntranceCMD();
                    entrance.initCommand(url1, "android", versionFile);
                    entrance.execute();
                }
                if (nativePath = egret.args.properties.getNativePath("ios")) {
                    var url1 = FileUtil.joinPath(nativePath, "proj.ios");
                    url2 = FileUtil.joinPath(nativePath, "Resources", "egret-game");
                    FileUtil.remove(url2);
                    FileUtil.createDirectory(url2);
                    FileUtil.copy(releasePath, url2);
                    //修改java文件
                    var entrance = new ChangeEntranceCMD();
                    entrance.initCommand(url1, "ios", versionFile);
                    entrance.execute();
                }
            });
        }
        return DontExitCode;
    };
    return Publish;
})();
module.exports = Publish;

//# sourceMappingURL=../commands/publish.js.map