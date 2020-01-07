const responseUtil = require('../module/responseUtil');
const statusCode = require('../module/statusCode');
const resMsg = require('../module/resMsg');
const pool = require('../module/pool');
const encrypt = require('../module/encryption');
const jwt = require('../module/jwt');

module.exports = {
    signin: async (id, password) => {
        const table = 'users';
        const query = `SELECT * FROM ${table} WHERE userId ='${id}'`;
        return await pool.queryParam_None(query)
            .then(async (userResult) => {
                if (userResult.length == 0) {
                    return {
                        code: statusCode.BAD_REQUEST,
                        json: responseUtil.successFalse(resMsg.NO_USER)
                    };
                }
                const user = userResult[0];
                const { hashed } = await encrypt.encryptWithSalt(password, user.salt);
                const { token } = jwt.sign(user);
                if (user.userPw != hashed) {
                    return {
                        code: statusCode.BAD_REQUEST,
                        json: responseUtil.successFalse(resMsg.MISS_MATCH_PW)
                    };
                }
                return {
                    code: statusCode.OK,
                    json: responseUtil.successTrue(resMsg.SIGN_IN_SUCCESS, { jwt: token, userIdx: jwt.verify(token).idx, userName: userResult[0].userName }),
                }
            })
            .catch(err => {
                console.log(err);
                throw err;
            });
    },
    getUserName : async (userIdx) => {
        const getUserNameQuery = `SELECT userName FROM users WHERE userIdx = ?`
        return await pool.queryParam_Arr(getUserNameQuery, [userIdx])
        .catch(err => {
            console.log(err);
            throw err;
        });
    },
    checkId: async (id) => {
        const table = 'users';
        const query = `SELECT * FROM ${table} WHERE userId = '${id}'`;
        return await pool.queryParam_None(query)
            .then(async (userResult) => {
                if (userResult.length == 0) return true;
                else return false;
            })
            .catch(err => {
                console.log(err);
                throw err;
            });
    },
    checkName: async (name) => {
        const table = 'users';
        const query = `SELECT * FROM ${table} WHERE userName = '${name}'`;
        return await pool.queryParam_None(query)
            .then(async (userResult) => {
                if (userResult.length == 0) return true;
                else return false;
            })
            .catch(err => {
                console.log(err);
                throw err;
            });
    },
    signup: async (userId, password, salt, deviceToken) => {
        const table = 'users';
        const fields = 'userId, userPw, salt, deviceToken, userName'
        const questions = `?, ?, ?, ?, ?`;
        const values = [userId, password, salt, deviceToken, ''];
        try {
            const result = await pool.queryParam_Arr(`INSERT INTO ${table}(${fields}) VALUES (${questions})`, values);
            if (result.code && result.json) return result;
            const userId = result.insertId;
            return {
                code: statusCode.OK,
                json: responseUtil.successTrue(resMsg.SIGN_UP_SUCCESS, userId)
            };
        } catch (err) {
            if (err.errno == 1062) {
                console.log(err.errno, err.code);
                return {
                    code: statusCode.BAD_REQUEST,
                    json: responseUtil.successFalse(resMsg.ALREADY_ID)
                };
            }
            console.log(err);
            throw err;
        }
    },
    setUserName: async (userName, userIdx) => {
        const table = 'users';
        try {
            const nameResult = await pool.queryParam_None(`UPDATE  ${table} SET userName ='${userName}' WHERE userIdx = '${userIdx}'`);
            if (nameResult.code && nameResult.json) return nameResult;
            return {
                code: statusCode.OK,
                json: responseUtil.successTrue(resMsg.SET_NAME_SUCCESS, { userName })
            };
        } catch (err) {
            if (err.errno == 1062) {
                console.log(err.errno, err.code);
                return {
                    code: statusCode.BAD_REQUEST,
                    json: responseUtil.successFalse(resMsg.ALREADY_NAME)
                };
            }
            console.log(err);
            throw err;
        }
    },
    setFavorite: async (favoriteInfo, favoriteCategory, favoriteLongitude, favoriteLatitude, userIdx) => {
        const favoritesQuery = `INSERT INTO favorites (favoriteInfo, favoriteCategory, favoriteLongitude, favoriteLatitude) VALUES (?,?,?,?)`;
        const userFavoriteQuery = (`INSERT INTO usersFavorites (userIdx, favoriteIdx) VALUES (?,?)`);
        return await pool.Transaction(async (conn) => {
            let setFavoriteResult = await conn.query(favoritesQuery, [favoriteInfo, favoriteCategory, favoriteLongitude, favoriteLatitude]);
            await conn.query(userFavoriteQuery, [userIdx, setFavoriteResult.insertId]);
        })
            .catch((err) => {
                return {
                    code: statusCode.BAD_REQUEST,
                    json: responseUtil.successFalse(resMsg.INTERNAL_SERVER_ERROR)
                };
            })

    },
    setDeviceToken: async (userId, deviceToken) => {
        const table = 'users';
        try {
            const result = await pool.queryParam_None(`UPDATE ${table} SET deviceToken = '${deviceToken}' WHERE userId = '${userId}'`)
            if (result.code && result.json) return result;
            const userName = result.insertId;
            return {
                code: statusCode.OK,
                json: responseUtil.successTrue(resMsg.SET_NAME_SUCCESS, userName)
            };
        } catch (err) {
            if (err.errno == 1062) {
                console.log(err.errno, err.code);
                return {
                    code: statusCode.BAD_REQUEST,
                    json: responseUtil.successFalse(resMsg.ALREADY_NAME)
                };
            }
            console.log(err);
            throw err;
        }
    },
    getDeviceToken: async (userIdx) => {
        const getDeviceToken = `SELECT deviceToken FROM users WHERE userIdx = ?`
        return await pool.queryParam_Arr(getDeviceToken, [userIdx])
            .catch((err) => {
                console.log('getDeviceToken err : ' + err);
            })
    },
    getFavorite: async (userIdx) => {
        const getFavoriteQuery = `SELECT * FROM favorites WHERE favoriteIdx IN (
                                    SELECT favoriteIdx FROM usersFavorites WHERE userIdx = ?)`
        return await pool.queryParam_Arr(getFavoriteQuery, [userIdx])
            .catch((err) => {
                console.log('getFavorite err : ' + err);
            })
    }
}
