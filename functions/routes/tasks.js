const admin = require('./admin.js');
const db = admin.firestore();
const router = require('express-promise-router')();
const auth = require('./auth.js');

/**
 * タスク登録
 */
router.post('/', async (req, res) => {
    let userId = auth.getUserId(req);
    if(!userId) {
        res.status(401).send({ 'error': 'Unauthorized' })
    }

    let addTask = {
        'title': req.body.title,
        'category': req.body.category,
        'limit': req.body.limit,
        'detail': req.body.detail,
        'created_at': new Date().toISOString()
    }
    let ref = await db.collection('tasks').add({ 'user_id': userId, ...addTask });
    res.send({
        'id': ref.id,
        ...addTask
    });
});

/**
 * タスク取得
 */
router.get('/:id', async (req, res) => {
    let userId = auth.getUserId(req);
    if(!userId) {
        res.status(401).send({ 'error': 'Unauthorized' })
    }
    let ref = db.collection('tasks').doc(req.params.id);

    let task = await ref.get().catch(err => {
        console.log('Error getting document', err)
        res.status(500).send({ 'message': 'Internal Server Error' });
    });

    if (!task.exists) {
        console.log('No such document!');
        res.status(404).send({ 'message': 'Not Found' });
    } else {
        let data = task.data();
        console.log('Document data:', data);
        delete data['user_id']
        res.send(data);
    };
});

/**
 * タスク一覧取得
 */
router.get('/', async (req, res) => {
    let userId = auth.getUserId(req);
    if(!userId) {
        res.status(401).send({ 'error': 'Unauthorized' })
    }

    let sortKeys = ['limit', 'created_at', 'category'];
    let sortKey = 'limit';
    if (sortKeys.includes(req.query.sort)) {
        sortKey = req.query.sort;
    }

    let ref = db.collection('tasks').where('user_id', '==', userId).orderBy(sortKey);
    let tasks = [];
    await ref.get().then(snapshot => {
        if (snapshot.empty) {
            console.log('No matching documents.');
            return;
        }

        snapshot.forEach(doc => {
            let data = doc.data();
            console.log(doc.id, '=>', data);
            delete data['user_id'];
            tasks.push({
                'id': doc.id,
                ...data
            });
        })
    }).catch(err => {
        console.log('Error getting documents', err);
        res.status(500).send({ 'message': 'Internal Server Error' });
    });

    res.send(tasks);
});

/**
 * タスク更新
 */
router.patch('/:id', async (req, res) => {
    let userId = auth.getUserId(req);
    if(!userId) {
        res.status(401).send({ 'error': 'Unauthorized' })
    }

    let updateTask = {
        'title': req.body.title,
        'category': req.body.category,
        'limit': req.body.limit,
        'detail': req.body.detail
    }
    await db.collection('tasks').doc(req.params.id).update(updateTask);
    res.send({
        'id': req.params.id,
        ...updateTask
    });
});

/**
 * タスク削除
 */
router.delete('/:id', async (req, res) => {
    let userId = auth.getUserId(req);
    if(!userId) {
        res.status(401).send({ 'error': 'Unauthorized' })
    }

    await db.collection('tasks').doc(req.params.id).delete();

    res.send({
        'message': 'Successfully deleted task.'
    });
});

module.exports = router;
