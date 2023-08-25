import bcrypt from "bcryptjs";
import { PubSub, withFilter } from "graphql-subscriptions";
import { PrismaClient, } from "@prisma/client";
import jwt from "jsonwebtoken";
import pubsub from "../facades/pubSubFacade.js";
const JWT_SECRET = "EN_DIOS_CONFIO_BY_JESUS";
const prisma = new PrismaClient();
const resolvers = {
    Query: {
        timeline: async (root, args, context) => {
            const myTimeline = await prisma.timeline.findMany({
                where: {
                    userId: context.user.id,
                },
                include: {
                    publication: {
                        select: {
                            id: true,
                            reaction: true,
                            type: true,
                            user: {
                                select: {
                                    avatar: true,
                                    username: true,
                                    id: true,
                                    email: true,
                                },
                            },
                            contents: true,
                            _count: {
                                select: {
                                    PublicationLikes: true,
                                    PublicationComments: true,
                                },
                            },
                        },
                    },
                },
                orderBy: {
                    createdAt: "desc",
                },
            });
            return myTimeline;
        },
        peoples: async (root, args) => {
            return prisma.user.findMany();
            // const peoples = await User.find();
            // return peoples;
        },
        getUsersByType: async (root, args) => {
            let typeSelected;
            typeSelected = {};
            const users = await prisma.user.findMany({
                where: { type: args.type },
                include: {
                    // followedBy: {
                    //   include: {
                    //     follower : {
                    //       select: {
                    //         id: true
                    //       }
                    //     }
                    //   }
                    // },
                    _count: {
                        select: {
                            followedBy: true,
                            following: true,
                        },
                    },
                },
            });
            return users;
        },
        // timelineCount: () => Timeline.collection.countDocuments(),
        me: (root, args, context) => {
            return context.user;
        },
        getChallange: async (root, args) => {
            return prisma.tournamentChallenges.findFirst({
                where: {
                    id: args.id,
                },
            });
        },
        getChallangeQuestions: async (root, args) => {
            const { ids } = args;
            return prisma.tournamentQuestions.findMany({
                where: {
                    id: {
                        in: ids,
                    },
                },
            });
            // return questions.map((question) => question.question);
        },
        getTournament: async (root, args) => {
            return prisma.tournament.findFirst({
                where: {
                    id: args.id,
                },
                include: {
                    players: {
                        orderBy: {
                            ranking: "asc",
                        },
                        select: {
                            id: true,
                            points: true,
                            ranking: true,
                            user: true,
                        },
                    },
                    challenges: {
                        select: {
                            id: true,
                            name: true,
                            questionsNumber: true,
                            questions: true,
                        },
                    },
                    _count: {
                        select: {
                            players: true,
                            challenges: true,
                        },
                    },
                },
            });
        },
        getAllTournaments: async () => {
            return prisma.tournament.findMany({
                where: {
                    status: "ACTIVE",
                },
                include: {
                    players: {
                        select: {
                            id: true,
                            points: true,
                            ranking: true,
                            user: true,
                        },
                    },
                    _count: {
                        select: {
                            players: true,
                        },
                    },
                },
            });
        },
        getChallangeByUser: async (root, args, MyContext) => {
            //Get all changes by user in an tournament
            const challenges = await prisma.tournamentChallenges.findMany({
                where: {
                    tournamentId: args.tournamentId,
                },
            });
            let userChallengesIds = [];
            await Promise.all(challenges.map(async (challenge) => {
                const userChallenge = await prisma.tournamentChallengesPlayer.findFirst({
                    where: {
                        userId: args.userId ?? MyContext.user.id,
                        challengeId: challenge.id,
                    },
                });
                if (userChallenge) {
                    userChallengesIds.push(userChallenge?.challengeId ?? 0);
                }
            }));
            return userChallengesIds;
        },
        getAllTournamentsPlayers: async () => {
            //Get array with all uniques users in tournaments
            //For each user, get data, points, ranking global in all torunament by points
            const tournaments = await prisma.tournament.findMany({
                where: {
                    status: "ACTIVE",
                },
                include: {
                    players: {
                        select: {
                            id: true,
                            points: true,
                            ranking: true,
                            user: true,
                            userId: true,
                        },
                    },
                    _count: {
                        select: {
                            players: true,
                        },
                    },
                },
            });
            let uniqueUsers = [];
            await Promise.all(tournaments.map(async (tournament) => {
                await Promise.all(tournament.players.map(async (player) => {
                    const user = await prisma.user.findFirst({
                        where: {
                            id: player.userId,
                        },
                    });
                    const userInArray = uniqueUsers.find((user) => user.id === player.userId);
                    if (!userInArray) {
                        uniqueUsers.push({
                            id: player.userId,
                            username: user?.username,
                            avatar: user?.avatar,
                            points: player.points,
                            ranking: player.ranking,
                        });
                    }
                    else {
                        userInArray.points += player.points;
                    }
                }));
            }));
            //Recalculate all ranking global by points
            let newArrayUserByRanking = uniqueUsers.sort((a, b) => b.points - a.points);
            newArrayUserByRanking.map((user, index) => {
                user.ranking = index + 1;
            });
            // uniqueUsers.sort((a, b) => b.points - a.points);
            return newArrayUserByRanking;
            // return uniqueUsers;
        },
        getUserInTournament: (root, args, MyContext) => {
            let userId = args.userId ?? MyContext.user.id;
            return prisma.tournamentPlayers.findFirst({
                where: {
                    tournamentId: args.tournamentId,
                    userId: userId,
                },
            });
        },
        getPublication: async (root, args) => {
            const publication = await prisma.publication.findFirst({
                where: {
                    id: args.id,
                },
                include: {
                    user: {
                        select: {
                            avatar: true,
                        },
                    },
                    contents: true,
                    PublicationLikes: true,
                    PublicationComments: true,
                },
            });
          
            return publication;
        },
        login: async (root, args) => {
            let userFind;
            userFind = {
                where: {
                    email: args.email,
                },
            };
            const user = await prisma.user.findFirst(userFind);
            //Decrypt password before compare with bcrypt
            if (!user || !bcrypt.compareSync(args.password, user.password)) {
                throw new Error("Invalid credentials");
            }
            const userForToken = {
                username: user.username,
                id: user.id,
            };
            return { token: jwt.sign(userForToken, JWT_SECRET), user: user };
        },
        getUser: async (root, args) => {
            const user = await prisma.user.findFirst({
                where: {
                    username: args.username,
                },
                include: {
                    following: {
                        include: {
                            follower: {
                                select: {
                                    avatar: true,
                                    username: true,
                                    id: true,
                                    email: true,
                                },
                            },
                        },
                    },
                    _count: {
                        select: {
                            followedBy: true,
                            following: true,
                        },
                    },
                },
            });
            console.log("user", user);
            return user;
        },
    },
    Mutation: {
        createUser: async (root, args, { prisma }) => {
            const { email, username, password, type } = args;
            const user = await prisma.user.create({
                data: {
                    email,
                    type,
                    username,
                    password: bcrypt.hashSync(password, 3),
                },
            });
            if (user) {
                const userForToken = {
                    username: user.username,
                    id: user.id,
                };
                return { token: jwt.sign(userForToken, JWT_SECRET), user: user };
            }
        },
        followUser: async (root, args, MyContext) => {
            try {
                //Check is the user is already following
                const data = await prisma.follows.findFirst({
                    where: {
                        followerId: MyContext.user.id,
                        followingId: args.followingId,
                    },
                });
                if (data) {
                    await prisma.follows.delete({
                        where: {
                            id: data.id,
                        },
                    });
                    return false;
                }
                await prisma.follows.create({
                    data: {
                        followerId: MyContext.user.id,
                        followingId: args.followingId,
                    },
                });
                return true;
            }
            catch (error) {
                console.log(error);
            }
        },
        updateUser: async (root, args, MyContext) => {
            try {
                const user = await prisma.user.update({
                    where: {
                        id: MyContext.user.id,
                    },
                    data: {
                        email: args.email,
                        username: args.username,
                        password: bcrypt.hashSync(args.password, 3),
                        avatar: args.avatar,
                        cover: args.cover,
                        avatar_thumbnail: args.avatar_thumbnail,
                        phone: args.phone,
                    },
                });
                return "ok";
            }
            catch (error) {
                console.log(error);
            }
            return null;
        },
        joinToBiblicalTournament: async (root, args, MyContext) => {
            try {
                let user = args.userId ?? MyContext.user.id;
                const tournament = await prisma.tournament.findFirst({
                    where: {
                        id: args.tournamentId,
                    },
                });
                if (tournament) {
                    //Check if the user is already in the tournament
                    const tournamentUserRaq = await prisma.tournamentPlayers.findFirst({
                        where: {
                            tournamentId: args.tournamentId,
                            userId: user,
                        },
                    });
                    if (tournamentUserRaq) {
                        return false;
                    }
                    const tournamentUser = await prisma.tournamentPlayers.create({
                        data: {
                            tournamentId: args.tournamentId,
                            userId: user,
                        },
                    });
                    if (tournamentUser) {
                        return true;
                    }
                }
                return false;
            }
            catch (error) {
                return false;
            }
        },
        createPublication: async (root, args, MyContext) => {
        
            return await prisma.$transaction(async (tx) => {
                const user = MyContext.user;
                //1 - Create the publication
                const publication = await tx.publication.create({
                    data: {
                        userId: user.id,
                        type: args.type,
                        reaction: args.reaction,
                    },
                    include: {
                        user: {
                            select: {
                                avatar: true,
                                username: true,
                            },
                        },
                    },
                });
                //2-save the content of the publication
                //Text : only one content text
                if (args.type === "TEXT") {
                    //Get value of the first element of the array
                    await tx.publicationContent.create({
                        data: {
                            publicationId: publication.id,
                            content: args.content,
                            type: 'TEXT'
                        },
                    });
                }
                if (args.type === "GALLERY") {
                    //Get images and save each  
                    args.images.filter((img) => img.startsWith('https')).map((image) => (image)).map(async (image) => {
                        await tx.publicationContent.create({
                            data: {
                                publicationId: publication.id,
                                content: image,
                                type: 'GALLERY'
                            },
                        });
                    });
                }
                //Save cntent
                await tx.publicationContent.create({
                    data: {
                        publicationId: publication.id,
                        content: args.content,
                    },
                });
                //SAve this post in all timeline for your followers
                const followers = await tx.follows.findMany({
                    where: {
                        followingId: user.id,
                    },
                });
                //Save the publication in the timeline of all followers
                await tx.timeline.createMany({
                    data: followers.map((follower) => ({
                        publicationId: publication.id,
                        userId: follower.followerId,
                    })),
                });
                //Send notification to all followers
                followers.map(async (follower) => {
                    let payload = {
                        postId: publication.id,
                        userId: follower.followerId,
                        user: user
                    };
                    pubsub.publish("POST_CREATED", payload);
                });
                return publication;
                //VIDEO : only one URL and one thumbnail image and one comment
                // if (args.type === "VIDEO" ) {
                //   await tx.publicationContent.createMany({
                //     data: {
                //       publicationId: publication.id,
                //       content: args.content[0],
                //     },
                //     data: {
                //       publicationId: publication.id,
                //       content: args.content[0],
                //     },
                //   });
                // }
            });
            // try {
            //   await publication.save();
            //   pubsub.publish("POST_CREATED", { postCreated: args });
            // } catch (error) {
            //   console.log(error);
            // }
            // return publication;
        },
        saveChallangeForOneUser: async (root, args, MyContext) => {
            try {
                let user = null;
                let points = parseInt(Number(args.points + args.bonusTimePoints).toFixed(2));
                //Get Challange
                const challange = await prisma.tournamentChallenges.findFirst({
                    where: {
                        id: args.challangeId,
                    },
                });
                if (challange) {
                    //Get Player by User
                    const player = await prisma.tournamentPlayers.findFirst({
                        where: {
                            userId: args.playerId ?? MyContext.user.id,
                            tournamentId: args.challangeId,
                        },
                    });
                    if (player) {
                        let user = await prisma.tournamentChallengesPlayer.create({
                            data: {
                                challengeId: challange.id,
                                playerId: player.id,
                                userId: args.playerId ?? MyContext.user.id,
                                points: args.points,
                                totalPoints: points,
                                bonusTimePoints: args.bonusTimePoints,
                            },
                            select: {
                                id: true,
                                points: true,
                            },
                        });
                    }
                    //Update the points of this  user in toruenament
                    const tournamentPlayer = await prisma.tournamentPlayers.findFirst({
                        where: {
                            id: player.id,
                        },
                    });
                    if (tournamentPlayer) {
                      
                        const tournamentPlayerUpdate = await prisma.tournamentPlayers.update({
                            where: {
                                id: tournamentPlayer.id,
                            },
                            data: {
                                points: tournamentPlayer.points + points,
                            },
                        });
                        if (tournamentPlayerUpdate) {
                            console.log("tournamentPlayerUpdate", tournamentPlayerUpdate);
                        }
                    }
                    //Fire a backgorunt function async to update the ranking of the tournament
                    await updateTournamentRanking(challange.tournamentId, points);
                    if (challange && player) {
                        return user;
                    }
                }
            }
            catch (error) {
                return false;
            }
        },
    },
    Subscription: {
        // postCreated: {
        //   subscribe: () => pubsub.asyncIterator(["POST_CREATED"]),
        // },
        postCreated: {
            resolve: (payload, args, context, info) => {
                
                return payload;
            },
            subscribe: withFilter(() => pubsub.asyncIterator("POST_CREATED"), (payload, variables) => {
                return payload.userId === variables.userId;
            }),
        },
    },
};
export default resolvers;
export const updateTournamentRanking = async (tournamentId, points) => {
    const tournament = await getTournament(tournamentId);
    //Get all players
    const players = await prisma.tournamentPlayers.findMany({
        where: {
            tournamentId: tournamentId,
        },
    });
    //Update ranking by points
    if (players) {
        players.sort((a, b) => (a.points < b.points ? 1 : -1));
        players.forEach(async (player, index) => {
            let userUpdate = await prisma.tournamentPlayers.update({
                where: {
                    id: player.id,
                },
                data: {
                    ranking: index + 1,
                },
            });
        });
    }
};
//Get tournemetn with prisma client
export const getTournament = async (tournamentId) => {
    return await prisma.tournament.findUnique({
        where: {
            id: tournamentId,
        },
    });
};
