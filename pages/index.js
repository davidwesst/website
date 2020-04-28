    import Link from 'next/link'

    export default function Home() {
        return (
            <>
                <h1>
                    Hello and welcome to my website!
                </h1>
                <section>
                    <h2>
                        A Note from DW
                    </h2>
                    <article>
                        <p>This is the official website for davidwesst, a.k.a. DW, a.k.a. Wessty.</p>
                        <p>I managed to break something on the old site. Not sure what, but it's definitely broken, so rather than try and fix a thing I didn't understand (i.e. Hugo) I decided to stick to what I know, which is JavaScript.</p>
                        <p>The catch is that I spend most of my B-time working on game development rather than web code, so I'll get to it eventually. :)</p>
                    </article>
                    <article>
                        <h2>In the meantime...</h2>
                        <p>Why not check out my social link down below? You can usually get a hold of me there.</p>
                    </article>
                    <footer>
                        <p>Thanks for Playing!</p>
                        <p>~ DW</p>
                    </footer>
                </section>
                <section>
                    <h2>Social Links</h2>
                    <ul>
                        <li>
                            <a href="https://youtube.com/davidwesst">YouTube Channel</a> - This is where I post most content these days. It's mainly gamedev focused, but my old stuff is still there.
                        </li>
                        <li>
                            <a href="https://twitter.com/davidwesst">Twitter</a>
                        </li>
                        <li>
                            <a href="https://github.com/davidwesst">GitHub</a>
                        </li>
                    </ul>
                </section>
            </>
        )
    }