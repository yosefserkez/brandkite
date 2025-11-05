import { motion } from "framer-motion";
import { Pointer } from "@/components/ui/pointer";
import {
	AnimatedSpan,
	Terminal,
	TypingAnimation,
} from "@/components/ui/terminal";

export function ContextInputProcessing() {
	return (
		<div className="">
			<Pointer>
				<motion.div
					animate={{
						// biome-ignore lint/style/noMagicNumbers: animation keyframe values
						scale: [0.8, 1, 0.8],
						// biome-ignore lint/style/noMagicNumbers: animation keyframe values
						rotate: [0, 5, -5, 0],
					}}
					transition={{
						duration: 1.5,
						repeat: Number.POSITIVE_INFINITY,
						ease: "easeInOut",
					}}
				>
					<svg
						className="text-pink-600"
						fill="none"
						height="40"
						viewBox="0 0 40 40"
						width="40"
						xmlns="http://www.w3.org/2000/svg"
					>
						<title>Heart animation</title>
						<motion.path
							// biome-ignore lint/style/noMagicNumbers: animation keyframe values
							animate={{ scale: [1, 1.2, 1] }}
							d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
							fill="currentColor"
							transition={{
								duration: 0.8,
								repeat: Number.POSITIVE_INFINITY,
								ease: "easeInOut",
							}}
						/>
					</svg>
				</motion.div>
			</Pointer>
			<div className="w-full space-y-4">
				<Terminal>
					<TypingAnimation>$ analyzing company documents...</TypingAnimation>

					<AnimatedSpan className="text-blue-500">
						✓ Extracted company name and industry
					</AnimatedSpan>

					<TypingAnimation>
						$ processing context and relationships...
					</TypingAnimation>

					<AnimatedSpan className="text-yellow-500">
						→ Building knowledge graph
					</AnimatedSpan>

					<TypingAnimation>$ generating company profile...</TypingAnimation>

					<AnimatedSpan className="text-green-500">
						✓ Company profile created successfully
					</AnimatedSpan>

					<AnimatedSpan className="text-purple-500">
						→ Just a moment...
					</AnimatedSpan>
				</Terminal>
			</div>
		</div>
	);
}
