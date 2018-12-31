const Discord = require('discord.js');
const Listing = require('./../modules/Listing');
const fs = require('fs');


module.exports.run = async (bot, message, args) => {
    let snipeChannel = message.channel;
    const filter = m => !m.author.bot;
    let game = new Listing();


    let raw = fs.readFileSync('./roles.json');
    let allowedRoles = JSON.parse(raw);

    let validation = function(serverRoles, userRoles){
        let val = false;
        serverRoles.forEach((role) => {
            userRoles.forEach((usr) => {
                if (role == usr){
                    val = true;
                }
            });
        });
        return val;
    }

    let editLast3 = null;

    let startMessage = new Discord.RichEmbed()
        .setTitle("Falae Scrim")
        .setDescription("Mandem os 3 ultimos dígitos do servidor")
        .setColor("#cc0000")
        .setFooter("Falae Scrim");

    message.channel.send({embed: startMessage});

    let time = 25;
    let editTime = "";

    let timeEmbed = new Discord.RichEmbed()
        .setTitle("Próxima partida em aproximadamente...")
        .setDescription(time + "minutos")
        .setColor("#00cc66")

    setTimeout(async () => {
        editTime = await message.channel.send({embed: timeEmbed}).catch( (err) => {
            console.log("Cant edit deleted message");
        });
    }, 10);

    let timeInterval = setInterval(() => {
        if (time === 1) {
            time -= 1;
            timeEmbed.setDescription(time + " minutos");
            clearInterval(timeInterval);
        } else {
            time -= 1;
            timeEmbed.setDescription(time + " minutos");
        }

        editTime.edit({embed: timeEmbed}).catch((err) => {
            console.log("cant edit");
            clearInterval(timeInterval);
        });

    }, 60000);

    let last3 = new Discord.RichEmbed()
        .setTitle("Mandem os ultimos 3 digitos do servidor")
        .setColor("#0066cc");
        
    setTimeout(async () => {
        editLast3 = await message.channel.send({embed: last3});
    }, 10);

    const collector = snipeChannel.createMessageCollector(filter, {max: 200, maxMatches : 200, time: 180000});

    collector.on('collect', m => {

        console.log(`Collected ${m.content} | ${m.author.username}`);

        if(validation(allowedRoles.roles,m.member.roles.array())){
            if (m.content === ".start"){
                collector.stop();
                console.log("Coletor parou");
                return;
            }
        }
        if (game.data.length === 0 && m.content.length === 3){
            game.addID(m.content.toUpperCase(), m.author.username);
        } else if (m.content.length === 3){
            if (game.userPresent(m.author.username)){
                game.deleteUserEntry(m.author.username);
                if (game.idPresent(m.content.toUpperCase())){
                    game.addUser(m.content.toUpperCase(), m.author.username);
                } else {
                    game.addID(m.content.toUpperCase(),m.author.username);
                }
            } else {
                if (game.idPresent(m.content.toUpperCase())){
                    game.addUser(m.content.toUpperCase(), m.author.username);
                } else {
                    game.addID(m.content.toUpperCase(), m.author.username);
                }
            }
        }

        game.sort();

        let str = "";
        last3 = new Discord.RichEmbed()
            .setTitle("Lobbys")
            .setColor("#0066cc");

        for (var i = 0; i < game.data.length; i++){
            str = "";
            for (var j = 0; j < game.data[i].users.length ; j++){
                str += game.data[i].users[j] + "\n";
            }
            last3.addField(`${game.data[i].id.toUpperCase()} - ${game.data[i].users.length} JOGADORES`, str, true);
        }

        editLast3.edit({embed: last3}).catch((err) => {
            console.log("Caught eddit error");
        });

        if (m.deletable){
            m.delete().catch((err) => {
                console.log("Cant delete");
                console.log(err);
            });
        }

    });

    collector.on('end', collected => {
        console.log(`Collected ${collected.size} items`);
    });


}



module.exports.help = {
    name: "start"
}