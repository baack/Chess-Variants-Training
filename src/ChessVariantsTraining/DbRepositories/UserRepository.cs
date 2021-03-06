﻿using ChessVariantsTraining.Configuration;
using ChessVariantsTraining.Models;
using Microsoft.Extensions.Options;
using MongoDB.Driver;
using System;
using System.Collections.Generic;
using System.Linq;

namespace ChessVariantsTraining.DbRepositories
{
    public class UserRepository : IUserRepository
    {
        MongoSettings settings;
        IMongoCollection<User> userCollection;

        public UserRepository(IOptions<Settings> appSettings)
        {
            settings = appSettings.Value.Mongo;
            GetCollection();
        }

        private void GetCollection()
        {
            MongoClient client = new MongoClient(settings.MongoConnectionString);
            userCollection = client.GetDatabase(settings.Database).GetCollection<User>(settings.UserCollectionName);
        }

        public bool Add(User user)
        {
            var found = userCollection.FindSync<User>(new ExpressionFilterDefinition<User>(x => x.ID == user.ID));
            if (found != null && found.Any()) return false;
            try
            {
                userCollection.InsertOne(user);
            }
            catch (Exception e) when (e is MongoWriteException || e is MongoBulkWriteException)
            {
                return false;
            }
            return true;
        }

        public void Update(User user)
        {
            userCollection.ReplaceOne(new ExpressionFilterDefinition<User>(x => x.ID == user.ID), user);
        }

        public void Delete(User user)
        {
            userCollection.DeleteOne(new ExpressionFilterDefinition<User>(x => x.ID == user.ID));
        }

        public User FindById(int id)
        {
            FilterDefinition<User> filter = Builders<User>.Filter.Eq("_id", id);
            return userCollection.Find(filter).FirstOrDefault();
        }

        public User FindByUsername(string username)
        {
            FilterDefinition<User> filter = Builders<User>.Filter.Regex("username", new MongoDB.Bson.BsonRegularExpression("^" + username + "$", "i"));
            return userCollection.Find(filter).FirstOrDefault();
        }

        public User FindByEmail(string email)
        {
            FilterDefinition<User> filter = Builders<User>.Filter.Regex("email", new MongoDB.Bson.BsonRegularExpression("^" + email + "$", "i"));
            return userCollection.Find(filter).FirstOrDefault();
        }

        public Dictionary<int, User> FindByIds(IEnumerable<int> ids)
        {
            FilterDefinition<User> filter = Builders<User>.Filter.In("_id", ids);
            return userCollection.Find(filter).ToEnumerable().ToDictionary(x => x.ID);
        }

        public User FindByPasswordResetToken(string token)
        {
            string hashed = PasswordRecoveryToken.GetHashedFor(token);
            FilterDefinition<User> filter = Builders<User>.Filter.Eq("passwordRecoveryToken.tokenHashed", hashed) & Builders<User>.Filter.Gte("passwordRecoveryToken.expiry", DateTime.UtcNow);
            return userCollection.Find(filter).FirstOrDefault();
        }
    }
}
