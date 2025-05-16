Steps:

git clone https://github.com/theBatm4n/SUI-Vercel.git

add a .env file with MONGODB_URI="..."

RUN the following commands:

docker build -t your-image-name .

docker run -p 8080:8080 your-image-name

To deploy your own token:

add your wallet private key in example.py & change parameters as needed 

Run "Node example.py"


