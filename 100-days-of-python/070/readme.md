585. Day 70 Goals - Learn to Deploy Your Website

## 588. Step 1 - Upload Your Project to GitHub
Step 1 - Upload Your Project to GitHub
So now that you've seen the power of Git and GitHub, it's time to put our blog project under version control. We're going to see how you can do this within PyCharm.

1. You can either use the final version of your blog project, or download a fresh, completed copy here.

https://repl.it/@appbrewery/blog-with-users-end.zip



2. Open the project in Pycharm and run it to make sure that everything is working as expected. If you downloaded my version from above, then make sure you install all the required packages.

Admin account email: angela@email.com

Admin account password: 123456



Local Version Control with PyCharm
3. Let's put our project under version control. We can do this in PyCharm by simply going to VCS -> Enable Version Control Integration.

This is the same as what we did before with

git init


Make sure that you select Git when asked which version control system to use:


If successful, you should now have a new Git Pane where you can see the Git Console and Git Logs.




All the files in our project will turn red because they are not yet added to the staging area to be tracked by git.




4. Add all the files in the project to the staging area by selecting the parent folder and going to VSC -> Git -> Add


All the files should now turn green.




5. Make your initial commit by going to VCS ->  Commit


Type the commit message in the commit pane:


If you see a popup about TODOs, just simply click on Commit.


If successful, you should now be able to see your first commit in the Git Log pane:




Push to Git Remote on GitHub


6. Sign up for a GitHub account if you haven't already and have your login details handy.



Before we upload our code to GitHub, we should be careful that we are not uploading any secret information. e.g. personal emails or API keys.

It's quite painful to review all the code for these things, so by convention, developers tend to put the top-secret information in an environment .env file.

NOTE: Make sure that you don't have any sensitive information in your project, if you do, create a .env file and store them there. We covered environment variables on Day 35.

Then we can add a .gitignore file to tell our version control system to ignore those files when pushing to a remote.



7. Go to gitignore.io and search for a Flask gitignore template. Copy all the text in the resulting page and create a new file at the top level of your project with the name .gitignore notice the dot at the beginning of the name, this is important, it makes it a hidden file. Paste everything from the gitignore page to this file. See the walkthrough below if you're unsure:




8. Add your GitHub details to PyCharm by going to the Version Control settings.

Windows: File -> Settings -> Version Control -> GitHub

Mac: PyCharm -> Preferences -> Version Control -> GitHub

Then click on the "+" button and select Login via GitHub:


Note: in Windows the "+" button is on the top right.

It should now take you to log in to GitHub, if successful, you should see your account added:




9. Next, create a new GitHub repo by going to VCS -> Import into Version Control -> Share Project on GitHub


In the pop-up, fill in the details for your new Github repository, e.g.


Now, PyCharm will create a new remote repository on GitHub in your account and push all the local commits to the remote.

If successful, you should see a popup with a link to your new repository. But you can also go to your GitHub account and find the new repository:


That's it, you've now added version control to your project and pushed it to GitHub.




## 589. Step 2 - Use gunicorn and Heroku to host your website

Step 2 - Use gunicorn and Heroku to host your website
Now that our project code is uploaded to GitHub we can use Heroku to host the code and deploy our website.



1. Sign up for a free account on www.heroku.com



2. Create a new application on Heroku:


Give your new app a unique name, I used angela-blog which means that no one else can use that name. It's just like a web address, it has to be unique. Leave the region as US and click Create App.




3. Connect Heroku to your GitHub project. Under the Deploy tab, select Connect to GitHub



4. Sign in to your GitHub account (the account where your blog project repository exists).



5. Search for the name of your blog project repository name (if in doubt check GitHub) and connect it to Heroku.


6. Scrolling further down the page on the deploy pane, click on Enable Automatic Deploys. This means that whenever you push a new commit to your remote GitHub repository, it will automatically re-deploy your server with the changes.




7. Finally, in Manual deploys, click on Deploy Branch to deploy for the first time.


NOTE: This step will take some time, but you can watch the logs for any errors and Google them if they prevent deployment. It might mean that you miss a step that we covered.

8. Once it's done, click View to see your web app, NOTE: it won't work just yet:


If everything went well, you should see the following:




It tells us to see the Heroku logs to see what went wrong.

9. Instead of using the command line as they suggested, we're going to view the logs on heroku.com

Make sure that you're in your app's dashboard page, go to More -> View Logs


In my case, it tells me that there are no web processes running:


This error tells me that our code is successfully hosted on Heroku but it doesn't know how to run our app.

That's what we'll do in the next lesson.


## 590. Step 3 - Setup a WSGI server with gunicorn

Step 3 - Setup a WSGI server with gunicorn
You might recall that every time we ran our app, we got a warning telling us that when we want to make our website go live and go from development to production mode that we should use a WSGI server.




WSGI stands for Web Server Gateway Interface and it's described here: https://www.python.org/dev/peps/pep-3333/

It standardises the language and protocols between our Python Flask application and the host server.

Again, but in English: Normal web servers can't run Python applications, so a special type of server was created (WSGI) to run python applications.

There are many WSGIs to choose from, but we'll use the most popular - gunicorn.

So Heroku will call gunicorn to run our code and gunicorn will know how to speak to Heroku.



1. In PyCharm go to the Python Interpreter for your Project and install the gunicorn package:

Windows: Files -> Settings -> Project: blog-with-user -> Python Interpretor

Mac: PyCharm -> Preferences -> Project: blog-with-user -> Python Interpretor


Note: Make a note of the version of gunicorn you installed e.g.




2. Add the package to the requirements.txt file on a new line:

gunicorn==<version number>


NOTE: Your version number will be higher than mine because you are in the future.



Next, we need to tell Heroku about our gunicorn server and how to run our Flask app, we do that using a Procfile.



3. Create a new file in the project top-level folder called Procfile

NOTE: make sure you spell the name of the file exactly as you see above, with a capital P and no file extension.

Type the following into the Procfile:

web: gunicorn main:app
This will tell Heroku to create a web worker, one that is able to receive HTTP requests.

To use gunicorn to serve your web app

And the Flask app object is the main.py file.

NOTE: If your app is not inside a file called main.py then you should change main to your file name.






4. Add the new Procfile/requirements.txt to git and commit the changes then push it to the remote.


Note: If you forgot to "Commit and Push" and just clicked on "Commit" then just go to VSC -> Git -> Push



Because we enabled automatic re-deploys, if you go to your app's logs you should see it being re-built an re-deployed with the changes we have pushed to GitHub.




All going well, you should now be able to go to your app and see the blog up and running.



## 591. Step 4 - Upgrade SQLite Database to PostgreSQL
  
Step 4 - Upgrade SQLite Database to PostgreSQL
Getting a website is not that easy huh?

You might be wondering what else we might possibly need to do after all that. There's just one last thing. When we were coding and testing our Flask website, it was nice to use a simple database like SQLite. But SQLite is a file-based database. This is its strength and weakness. It's a strength because while we're coding up our database and debugging, it's really useful to be able to open the SQLite file using DB Viewer and see how our data looks.


But it's also a weakness because once it's deployed with Heroku the file locations are shifted around every 24 hours or so. This means that your database might just get wiped every day. That will mean some very unhappy users. Read more here.

So we've got to put on our big-boy/big-girl pants and upgrade our simple SQLite database to PosgreSQL, a database that can handle millions of data entries and reliably delivers data to users.

Luckily, because we used SQLAlchemy to create our Flask app, there's nothing we need to change in terms of code. We just need to set up the PostgreSQL database and tell Heroku about it.



1. Go to your app's dashboard on Heroku and go to the Resources tab. Then search for Heroku Postgres.


Next, you will see a popup, keep the free-tier and click Submit.




Next, we need to connect to this Heroku Postgres database instead of the local SQLite database.

2. Go to Settings -> Reveal Config Vars




This is the same as our .env file, it's where you can put top secret stuff like API keys and passwords. Then you give it a variable name and you can tap into the value using os.environ.get("VAR_NAME") .

You'll see that we already have the Postgres database convifg var set up. We just need to connect to it from our code file.


3. Copy the name of the database config var (mine is DATABASE_URL) and add it to your main.py instead of the sqlite URL.




4. Let's move our SECRET_KEY into the config var as well.




5. SQLite is pre-installed for all Python projects, but if we are going to use Postgres, we'll need to install the psycopg2-binary packages as well. Note, you'll also need to add the package name and version to requirements.txt as well as commit and push the updates.




Important, make sure that you don't include any pipfile or pipfile.lock files in your GitHub repo (you can delete them and commit the changes). Heroku needs to know which packages they should install on their side



Because our main.py SQLAlchemy database is now pointing to an environment variable that is only avilable on Heroku, if you run the app right now locally, you will get some errors.

Instead, we want to provide SQLite as the alternative when we're developing the app locally.



5. Update the app config to use "DATABASE_URL" environment variable if provided, but if it's None (e.g. when running locally) then we can provide sqlite:///blog.db as the alternative.

app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get("DATABASE_URL",  "sqlite:///blog.db")


Finally, if you go to your heroku app, it should now be up and using a Postgres database.

Whoohoo! Congratulations if you got this far!



Also, check out my version:

https://angela-blog.herokuapp.com/
