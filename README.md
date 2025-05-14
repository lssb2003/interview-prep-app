## Step-by-Step Setup Instructions

### 1. Clone the Repository

```bash
# Clone the repository
git clone https://github.com/lssb2003/interview-prep-app.git

# Navigate to the project directory
cd interview-prep-app
```

### 2. Install Dependencies

```bash
# Install all required packages
npm install
```

### 3. Set Up Environment Variables

```bash
# Create a .env file by copying the example
cp .env.example .env
```

Then edit the `.env` file and add your own Firebase and OpenAI credentials:

```env
# Firebase Configuration
REACT_APP_FIREBASE_API_KEY=your_firebase_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id

# OpenAI Configuration
REACT_APP_OPENAI_API_KEY=your_openai_api_key
```

### 4. Set Up Firebase Project

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Create a new project (or use an existing one)
3. Set up the following Firebase services:

#### a. Authentication

* Go to **Authentication** → **Sign-in method**
* Enable **Email/Password** authentication

#### b. Firestore Database

* Go to **Firestore Database** → **Create database**
* Start in **production mode** or **test mode**
* Choose a location close to your users

#### c. Storage

* Go to **Storage** → **Get started**
* Choose a location close to your users

4. Get your Firebase configuration:

* Go to **Project settings** → **General**
* Scroll down to **"Your apps"** and select the web app (create one if needed)
* Copy the configuration values to your `.env` file

### 5. Start the Development Server

```bash
npm start
```

The application should now be running at [http://localhost:3000](http://localhost:3000)