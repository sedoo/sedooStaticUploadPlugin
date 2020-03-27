const fs = require("fs");
const path = require("path");
const axios = require("axios");
const pkgVersion = require("./package.json").version;
const pkgName = require("./package.json").name;
const getLogger = require("webpack-log");
const log = getLogger({ name: "Sedoo static upload plugin" });

function StaticUploadPlugin(options) {
    this.files = options.files;
    this.url = options.url;
}

StaticUploadPlugin.prototype.apply = function(compiler) {
    compiler.plugin("emit", (compilation, done) => {

        let files = [];
        for (let i = 0; i < this.files.length; i++) {


            try {
                if (fs.lstatSync(this.files[i]).isFile()) {
                    files.push(this.files[i]);
                } else {

                    try {
                        let items = fs.readdirSync(this.files[i]);
                        items.forEach(item => {
                            files.push(this.files[i] + "/" + item);
                        })
                    } catch (err) {
                        log.error("Error while reading directory " + this.files[i])
                    }
                }
            } catch (e) {
                log.error("Error while reading " + this.files[i])
            }
        }


        for (let i = 0; i < files.length; i++) {
            let filePath = files[i];
            fs.readFile(filePath, (err, file) => {
                let fileName = path.basename(filePath);
                if (err) {
                    process.stderr.write(`Error reading file ${filePath}`);
                    process.exit(1);
                }
                let url = this.url + "?fileName=" + fileName;
                axios({
                        method: "post",
                        url: url,
                        headers: {},
                        data: {
                            content: file
                        }
                    })
                    .then(function({ data }) {
                        log.info(
                            "📤 File " +
                            fileName +
                            " has been uploaded. It is available at URL: " +
                            url.replace("webpackupload", "download")
                        );
                    })
                    .catch(function(error) {
                        console.log(
                            "!!! File " +
                            this.filePath +
                            " has not been uploaded. Error " +
                            error.message
                        );
                    });

            });
        }
        done();
    });
};

module.exports = StaticUploadPlugin;
