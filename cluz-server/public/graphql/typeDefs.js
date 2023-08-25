const typeDefs = `#graphql
 input UserCreateInput {
  username: String!
  email: String!
  password: String!
  type: String!
}
input UserLoginInput {
  email: String!
  password: String!
}

type UserInTournament {
  ranking: Int
  points: Int
  userId: Int
  tournamentId: Int
  user: User
  }

type Challenge {
  id: Int,
  category: String,
  time: Int,
  level: String,
  name: String,
  questions: String,
  questionsNumber: Int,
  }

  type TournamentCount {
    players: Int
    challenges: Int
  }

type Tournament {
  id: Int
  avatar: String
  resume: String
  title: String
  description: String
  startDate: DateTime
  endDate:  DateTime
  challenges: [Challenge]
  players: [UserInTournament]
  _count: TournamentCount
  }

type TournamentPlayer {
  id: Int
  username: String
  avatar: String
  points: Float
  ranking: Int
  }

  type Question {
    categories: String,
    tags: String,
    level: String,
    question: String,
    answers: String,
    questionType:  String,
    questionPicture:  String,
    answerSelectionType:  String,
    correctAnswer:  String,
    explanation:  String,
  }

  type UserInChallenge {
    id: Int
    points: Float
  }

type Avatar {
    id: ID!
    url: String
  }

type Timeline {
  id: ID!
  type: String
  readed: String
  publication: Post
} 

  type Post {
    id: ID!
    reaction: String
    type: String 
    user: User
    contents: [PublicationContent]
    _count: PublicationCount
  }

  type PublicationCount {
    PublicationLikes: Int,
    PublicationComments: Int
  }

  type PublicationContent {
    id: ID
    content: String
    type: String
    }

  type Person {
    id:  ID!,
    name: String
    email: String,
  }
  type NewUserType {
    user:  User!,
    token: String!
  }

  type FollowBy  {
    follower: Follow
    }
  type Following  {
    following: Follow
    }

    type Avatar {
      id:  ID!
      url: String
    }
    
  type FollowCount {
    followedBy: Int,
    following: Int
  }

type PostCreated {
  postId: Int,
  userId: Int,
  user: User
}


 type Follow {
  avatar: String,
  username: String,
  id: Int,
  followedBy: [FollowBy]
  following: [Following]
  }

  type User {
    id:  ID!,
    email: String,
    avatar: String,
    phone : String,
    cover: String,
    avatar_thumbnail: String,
    username:  String!,
    type: String!
    followedBy: [FollowBy],
    following: [Following],
    include: [FollowBy],
    _count:  FollowCount
  }
  type Token {
   token: String!
  }
  type Query {
    timeline: [Timeline],
    getPublication(id:Int): Post,
    peoples(
     offset: Int,
      limit: Int
    ): [User],
    getUsersByType(
      offset: Int,
      limit: Int,
      type: String!
    ): [User],
    timelineCount: Int,
    me: User,
    getUser(
     username: String!
    ): User,
    login(
      email: String!,
      password: String!
    ): NewUserType,
    getAllTournaments: [Tournament],
    getAllTournamentsPlayers: [TournamentPlayer],
    getTournament(
      id: Int!
    ): Tournament,
    getChallange(
      id: Int!
    ): Challenge,
    getChallangeByUser(
      userId: Int
      tournamentId: Int!
    ): [Int],
    getChallangeQuestions(
      ids: [Int]
    ): [Question],
    getUserInTournament(
      tournamentId: Int!
      userId: Int
    ): UserInTournament
      
  }

  type Mutation {
    createUser(username: String!, email: String!,password: String!,type: String!): NewUserType
    updateUser(email: String!,username: String!, password: String!,avatar: String!, cover: String,avatar_thumbnail: String, phone: String): String
    followUser(
      followingId: Int!
    ): Boolean
    createPublication(
      type: String!,
      content: String,
      images: [String],
      reaction: String
    ): Post
    joinToBiblicalTournament(
      userId: Int,
      tournamentId: Int!,
      ) : Boolean,
     saveChallangeForOneUser(
      challengeId: Int!,
      playerId: Int,
      points: Float,
      bonusTimePoints:Float,
      ) : UserInChallenge,
   }

   type Subscription {
    postCreated(
      userId: Int!
    ): PostCreated
}

`;
export default typeDefs;
