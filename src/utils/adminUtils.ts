require('dotenv').config()
import bot from "../index";


async function isSudo(id: any) {

    if(process.env.SUDO_ID == undefined){
        return
    }

    if ( process.env.SUDO_ID.split(",").includes(id.toString())) {
        return true;
    } else {
        return false;
    }

}

async function isAdmin(id: any, chat_id: any) {
    //this function validate if is admin

    const admins = await bot.getChatAdministrators(chat_id);
    const admin = admins.find((admin: any) => admin.user.id == id);
    if (admin) {
        return true;
    }
    return false;

}

async function getBotInfo() {
    const info = await bot.getMe();
    return info;
}

export { isSudo, isAdmin, getBotInfo }