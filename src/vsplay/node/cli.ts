import { storage } from "../../base/storage";

async function main() {
    console.log(storage.data);
    for (let i = 0; i < 5; i++) {
        console.log(i);
        await new Promise((resolve) => setTimeout(resolve, 1000));
    }
}

main();
