const express = require('express')
const router = express.Router();
const uploadChunksMiddleware = require('../chunk.js');
const fs = require('fs');
const path = require('path');
const fileBasePath = 'uploads/';
const chunkBasePath = '~uploads/';

router.post('/upload_chunks', uploadChunksMiddleware, (req, res) => {
    // 创建chunk的目录
    const chunkTmpDir = chunkBasePath + req.body.hash + '/';
    // 判断目录是否存在
    if (!fs.existsSync(chunkTmpDir)) fs.mkdirSync(chunkTmpDir);
    // 移动切片文件
    fs.renameSync(req.file.path, chunkTmpDir + req.body.hash + '-' + req.body.index);
    res.send(req.file);
})

// 文件分片
router.post('/merge_chunks', (req, res) => {
    const total = req.body.total;
    const hash = req.body.hash;
    const resetname = req.body.resetname;
    // const saveDir = '2344'
    const saveDir = fileBasePath + new Date().getFullYear() + (new Date().getMonth() + 1) + new Date().getDate() + '/';
    let savePath = '';
    if (resetname == '1') {
        savePath = saveDir + Date.now() + hash + '.' + req.body.ext;

    } else {
        savePath = saveDir + resetname + '.' + req.body.ext;
    }
    const chunkDir = chunkBasePath + '/' + hash + '/';
    console.log(savePath);
    try {
        // 创建保存的文件夹(如果不存在) 
        if (!fs.existsSync(saveDir)) fs.mkdirSync(saveDir);
        // 创建文件
        fs.writeFileSync(savePath, '');
        // 读取所有的chunks 文件名存放在数组中
        const chunks = fs.readdirSync(chunkBasePath + '/' + hash);
        // 检查切片数量是否正确
        if (chunks.length !== total || chunks.length === 0) return res.send({ code: -1, msg: '切片文件数量不符合' });
        for (let i = 0; i < total; i++) {
            // 追加写入到文件中
            fs.appendFileSync(savePath, fs.readFileSync(chunkDir + hash + '-' + i));
            // 删除本次使用的chunk
            fs.unlinkSync(chunkDir + hash + '-' + i);
        }
        // 删除chunk的文件夹
        fs.rmdirSync(chunkDir);
        // 返回uploads下的路径，不返回uploads
        res.json({
            code: 0,
            msg: '文件上传成功',
            data: {
                path: savePath.split(fileBasePath)[savePath.split(fileBasePath).length - 1]
            }
        });
    } catch (err) {
        res.json({ code: -1, msg: '出现异常,上传失败' });
    }
});
module.exports = router