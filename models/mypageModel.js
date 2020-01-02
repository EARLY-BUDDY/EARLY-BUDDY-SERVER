const responseUtil = require('../module/responseUtil');
const statusCode = require('../module/statusCode');
const resMsg = require('../module/resMsg');
const pool = require('../module/pool');


module.exports = {
    changeNickname : async(changeName,userIdx)=>{
        const table = 'users';
        try{
            const result =  await pool.queryParam_None( `UPDATE ${table} SET userName = '${changeName}' WHERE userIdx = '${userIdx}'`)
            if (result.code && result.json) return result;
            return {
                code: statusCode.OK,
                json: responseUtil.successTrue(resMsg.CHANGE_NAME_SUCCESS, changeName)
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

    getUserId : async(id)=>{
        const table = 'users';
        try{
            const result =  await pool.queryParam_None( `SELECT userId FROM '${table} WHERE userIdx = '${userIdx}'`)
            if (result.code && result.json) return result;
            console.log("result : ", result);
            return {
                code: statusCode.OK,
                json: responseUtil.successTrue(resMsg.CHANGE_NAME_SUCCESS, id)
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
    changePw: async (userIdx, password) =>{
        const table = 'users';
        // 기존 비밀번호, 바꿀 비밀번호 
        // 기존 비밀번호 - 사용자가 맞는지 -> 솔트, 해시 | 비밀번호 + 솔트 -> 저장된 해시랑 비교
        // 그 때 아래에 있는 쿼리를 사용 
        // transaction -> rollback()
        const query = `UPDATE '${table} SET userPw = '${password}'WHERE userIdx = '${userIdx}'`;
    },
    changeFavorite :  async(changeCategory, changeInfo, changeLongitude,changeLatitude,userIdx)=>{
        const table = favorites;
        try{
            const query = 
                `UPDATE ${table} SET favoriteCategory =?, favoriteInfo =?, favoriteLongitude=?, favoriteLatitude=? 
                WHERE favoriteIdx IN (SELECT favoriteIdx FROM userFavorite where userIdx = '${userIdx}'`;
                const result =  await pool.queryParam_Arr(query, [changeCategory, changeInfo, changeLongitude,changeLatitude])
                console.log("result : ", result);
            if (result.code && result.json) return result;
            return {
                code: statusCode.OK,
                json: responseUtil.successTrue(resMsg.CHANGE_NAME_SUCCESS, changeCategory, changeInfo, changeLongitude,changeLatitude)
            };
            //에러 처리 덜 되어있음.
        } catch (err) {
            if (err.errno == 1062) {
                console.log(err.errno, err.code);
                return {
                    code: statusCode.BAD_REQUEST,
                    json: responseUtil.successFalse(resMsg.ALREADY_FAVORITE)
                };
            }
            console.log(err);
            throw err;
        }
    },

    withdrawal : async (userIdx) =>{
        const table = 'users';
        const query = `DELETE FROM'${table}'WHERE userIdx = '${userIdx}' `;

    }
}
