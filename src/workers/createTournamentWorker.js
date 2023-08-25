import { PrismaClient } from "@prisma/client";
import { parentPort, workerData } from "worker_threads";
import { parseISO } from "date-fns";

const prisma = new PrismaClient();
const createTournamentWorker = async () => {
  const { args, userId } = workerData;

  try {
    const tournament = await prisma.$transaction(async (tx) => {
      const createdTournament = await tx.tournament.create({
        data: {
          title: args.tournamentName,
          status: "ACTIVE",
        //  userId: userId,
          resume: args.tournamnetResume,
          reward: args.reward,
       //   currencyId: args.currencyId ?? null,
          startDate: parseISO(args.startDate),
          endDate: parseISO(args.endDate),
        //  languageId: args.languageId,
          //groupId: args.groupId,
          user: {
            connect: {
              id: userId,
            },
          },
          currency: {
            connect: {
              id: args.currencyId,
            },
          },
          Language: {
            connect: {
              id: args.languageId,
            },
          },
          group: {
            connect: {
              id: args.groupId,
            },
          },
        },
      });

      if (createdTournament) {
        const questions = await tx.tournamentQuestions.findMany({
          where: {
            languageId: args.languageId,
          },
        });

        if (questions.length < args.questionsNumber * args.challengesNumber) {
          throw new Error(
            "No hay suficientes preguntas para crear el torneo" +
              questions.length +
              " ---- " +
              args.questionsNumber * args.challengesNumber
          );
        }

        if (questions.length > 0) {
          const selectedQuestions = [];
          const questionsAdded = [];
          const challenges = [];
          let questionsForWhile = [...questions]; // Copy array for eliminate questions already added

          let index = 0;
          while (index < args.challengesNumber) {
            const questionIds = [];
            for (let i = 0; i < args.questionsNumber; i++) {
              let question = null;
              while (
                question === null ||
                questionsAdded.includes(question.id)
              ) {
                question =
                  questionsForWhile[
                    Math.floor(Math.random() * questionsForWhile.length)
                  ];
                questionsForWhile = questionsForWhile.filter(
                  (q) => q.id !== question.id
                );
              }
              questionsAdded.push(question.id);
              questionIds.push(question.id);
            }

            challenges.push(
              await tx.tournamentChallenges.create({
                data: {
                  tournament: { connect: { id: createdTournament.id } },
                  category: "General",
                  name: `Desafío ${index + 1}`,
                  level: "1",
                  time: 5,
                  questionsNumber: args.questionsNumber,
                  questions: JSON.stringify(questionIds),
                },
              })
            );

            console.log("Challenge created", challenges);
            index++;
          }

          console.log("Finish Creating chanlalges ", challenges);
          await Promise.all(challenges);
        }
      }

      return true;
    });

    parentPort.postMessage(tournament);
  } catch (error) {
    console.log(error);
    throw new Error(error.message);
  }
};

createTournamentWorker();
